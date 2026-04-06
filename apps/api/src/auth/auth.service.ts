import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRole as PrismaAuthRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getSuperAdminCredentials } from '../config/runtime-env';
import { hashPassword, verifyPassword } from './password';
import {
  parseAccountRole,
  parsePassword,
  parseRequiredPassword,
  parseRequiredText,
  validateNewPassword,
} from './auth.parsers';

type AuthenticatedUser = {
  accountId: string;
  name: string;
  role: 'super-admin' | 'student' | 'teacher';
  mustChangePassword: boolean;
};

type ClientIpHeaders = {
  forwardedFor?: string;
  realIp?: string;
};

const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 1000 * 60 * 10;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(body: Record<string, unknown>, clientIpHeaders: ClientIpHeaders) {
    const clientIp = normalizeClientIp(clientIpHeaders);
    const cooldownSeconds =
      await this.getRemainingLoginCooldownSeconds(clientIp);

    if (cooldownSeconds > 0) {
      throw new HttpException(
        `로그인 시도가 너무 많습니다. ${cooldownSeconds}초 후 다시 시도해주세요.`,
        429,
      );
    }

    const id = parseRequiredText(body.id, '아이디');
    const password = parseRequiredPassword(body.password, '비밀번호');
    const user = await this.findAuthenticatedUser(id, password);

    if (!user) {
      await this.registerFailedLoginAttempt(clientIp);
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    await this.clearFailedLoginAttempts(clientIp);
    const session = await this.createSession(user);

    return {
      ok: true,
      user,
      session,
    };
  }

  async changePassword(body: Record<string, unknown>) {
    const accountId = parseRequiredText(body.accountId, '계정 아이디');
    const role = parseAccountRole(body.role);
    const allowMissingCurrentPassword =
      body.allowMissingCurrentPassword === true;
    const currentPassword = allowMissingCurrentPassword
      ? parsePassword(body.currentPassword)
      : parseRequiredPassword(body.currentPassword, '현재 비밀번호');
    const newPassword = parseRequiredPassword(body.newPassword, '새 비밀번호');
    const sessionId =
      typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

    validateNewPassword(newPassword);

    const user =
      role === 'student'
        ? await this.changeStudentPassword(
            accountId,
            currentPassword,
            newPassword,
            allowMissingCurrentPassword,
          )
        : await this.changeTeacherPassword(
            accountId,
            currentPassword,
            newPassword,
            allowMissingCurrentPassword,
          );

    if (sessionId) {
      await this.revokeOwnedSession(sessionId, user.accountId, user.role);
    }

    const session = await this.createSession(user);

    return {
      ok: true,
      user,
      session,
    };
  }

  async resolveSession(body: Record<string, unknown>) {
    const sessionId = parseRequiredText(body.sessionId, '세션 아이디');
    const session = await this.getActiveSession(sessionId);

    if (!session) {
      return {
        ok: false,
        session: null,
      };
    }

    return {
      ok: true,
      session,
    };
  }

  async revokeSession(body: Record<string, unknown>) {
    const sessionId = parseRequiredText(body.sessionId, '세션 아이디');

    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      ok: true,
    };
  }

  private async findAuthenticatedUser(id: string, password: string) {
    const superAdmin = this.findAuthenticatedSuperAdmin(id, password);

    if (superAdmin) {
      return superAdmin;
    }

    const student = await this.prisma.student.findUnique({
      where: {
        studentId: id,
      },
      select: {
        studentId: true,
        name: true,
        passwordHash: true,
        mustChangePassword: true,
      },
    });

    if (student && verifyPassword(password, student.passwordHash)) {
      return {
        accountId: student.studentId,
        name: student.name,
        role: 'student',
        mustChangePassword: student.mustChangePassword,
      } satisfies AuthenticatedUser;
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: {
        teacherId: id,
      },
      select: {
        teacherId: true,
        name: true,
        passwordHash: true,
        mustChangePassword: true,
      },
    });

    if (teacher && verifyPassword(password, teacher.passwordHash)) {
      return {
        accountId: teacher.teacherId,
        name: teacher.name,
        role: 'teacher',
        mustChangePassword: teacher.mustChangePassword,
      } satisfies AuthenticatedUser;
    }

    return null;
  }

  private findAuthenticatedSuperAdmin(id: string, password: string) {
    const credentials = getSuperAdminCredentials();

    if (id !== credentials.id || password !== credentials.password) {
      return null;
    }

    return {
      accountId: credentials.id,
      name: '최고관리자',
      role: 'super-admin',
      mustChangePassword: false,
    } satisfies AuthenticatedUser;
  }

  private async changeStudentPassword(
    accountId: string,
    currentPassword: string,
    newPassword: string,
    allowMissingCurrentPassword: boolean,
  ) {
    const student = await this.prisma.student.findUnique({
      where: {
        studentId: accountId,
      },
      select: {
        studentId: true,
        name: true,
        passwordHash: true,
        mustChangePassword: true,
      },
    });

    const canSkipCurrentPassword =
      allowMissingCurrentPassword && student?.mustChangePassword === true;

    if (
      !student ||
      (!canSkipCurrentPassword &&
        !verifyPassword(currentPassword, student.passwordHash))
    ) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    await this.prisma.student.update({
      where: {
        studentId: student.studentId,
      },
      data: {
        passwordHash: hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    return {
      accountId: student.studentId,
      name: student.name,
      role: 'student' as const,
      mustChangePassword: false,
    };
  }

  private async changeTeacherPassword(
    accountId: string,
    currentPassword: string,
    newPassword: string,
    allowMissingCurrentPassword: boolean,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        teacherId: accountId,
      },
      select: {
        teacherId: true,
        name: true,
        passwordHash: true,
        mustChangePassword: true,
      },
    });

    const canSkipCurrentPassword =
      allowMissingCurrentPassword && teacher?.mustChangePassword === true;

    if (
      !teacher ||
      (!canSkipCurrentPassword &&
        !verifyPassword(currentPassword, teacher.passwordHash))
    ) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    await this.prisma.teacher.update({
      where: {
        teacherId: teacher.teacherId,
      },
      data: {
        passwordHash: hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    return {
      accountId: teacher.teacherId,
      name: teacher.name,
      role: 'teacher' as const,
      mustChangePassword: false,
    };
  }

  private async createSession(
    user: Pick<AuthenticatedUser, 'accountId' | 'role' | 'mustChangePassword'>,
  ) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const session = await this.prisma.authSession.create({
      data: {
        accountId: user.accountId,
        role: toPrismaAuthRole(user.role),
        mustChangePassword: user.mustChangePassword,
        expiresAt,
      },
      select: {
        id: true,
        accountId: true,
        role: true,
        mustChangePassword: true,
        expiresAt: true,
      },
    });

    return serializeSession(session);
  }

  private async getActiveSession(sessionId: string) {
    const normalizedSessionId = sessionId.trim();

    if (!normalizedSessionId) {
      throw new BadRequestException('세션 아이디가 올바르지 않습니다.');
    }

    const session = await this.prisma.authSession.findUnique({
      where: {
        id: normalizedSessionId,
      },
      select: {
        id: true,
        accountId: true,
        role: true,
        mustChangePassword: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!session) {
      return null;
    }

    if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      if (!session.revokedAt) {
        await this.prisma.authSession.updateMany({
          where: {
            id: normalizedSessionId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }

      return null;
    }

    return serializeSession(session);
  }

  private async revokeOwnedSession(
    sessionId: string,
    accountId: string,
    role: 'student' | 'teacher',
  ) {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        accountId,
        role: toPrismaAuthRole(role),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async getRemainingLoginCooldownSeconds(key: string) {
    const throttle = await this.prisma.loginThrottle.findUnique({
      where: {
        key,
      },
      select: {
        failedCount: true,
        windowStartedAt: true,
        lockedUntil: true,
      },
    });

    if (!throttle) {
      return 0;
    }

    const now = Date.now();

    if (
      throttle.lockedUntil &&
      throttle.lockedUntil.getTime() > now &&
      throttle.failedCount >= MAX_LOGIN_ATTEMPTS
    ) {
      return Math.ceil((throttle.lockedUntil.getTime() - now) / 1000);
    }

    if (now - throttle.windowStartedAt.getTime() > LOGIN_WINDOW_MS) {
      await this.prisma.loginThrottle
        .delete({
          where: {
            key,
          },
        })
        .catch(() => undefined);
    }

    return 0;
  }

  private async registerFailedLoginAttempt(key: string) {
    const now = new Date();
    const existing = await this.prisma.loginThrottle.findUnique({
      where: {
        key,
      },
      select: {
        failedCount: true,
        windowStartedAt: true,
      },
    });

    if (
      !existing ||
      now.getTime() - existing.windowStartedAt.getTime() > LOGIN_WINDOW_MS
    ) {
      await this.prisma.loginThrottle.upsert({
        where: {
          key,
        },
        update: {
          failedCount: 1,
          windowStartedAt: now,
          lockedUntil: null,
        },
        create: {
          key,
          failedCount: 1,
          windowStartedAt: now,
          lockedUntil: null,
        },
      });
      return;
    }

    const failedCount = existing.failedCount + 1;
    const lockedUntil =
      failedCount >= MAX_LOGIN_ATTEMPTS
        ? new Date(existing.windowStartedAt.getTime() + LOGIN_WINDOW_MS)
        : null;

    await this.prisma.loginThrottle.update({
      where: {
        key,
      },
      data: {
        failedCount,
        lockedUntil,
      },
    });
  }

  private async clearFailedLoginAttempts(key: string) {
    await this.prisma.loginThrottle.deleteMany({
      where: {
        key,
      },
    });
  }
}

function serializeSession(session: {
  id: string;
  accountId: string;
  role: PrismaAuthRole;
  mustChangePassword: boolean;
  expiresAt: Date;
}) {
  return {
    id: session.id,
    accountId: session.accountId,
    role: fromPrismaAuthRole(session.role),
    mustChangePassword: session.mustChangePassword,
    expiresAt: session.expiresAt.toISOString(),
  };
}

function toPrismaAuthRole(role: 'super-admin' | 'student' | 'teacher') {
  switch (role) {
    case 'super-admin':
      return PrismaAuthRole.SUPER_ADMIN;
    case 'student':
      return PrismaAuthRole.STUDENT;
    case 'teacher':
      return PrismaAuthRole.TEACHER;
  }
}

function fromPrismaAuthRole(role: PrismaAuthRole) {
  switch (role) {
    case PrismaAuthRole.SUPER_ADMIN:
      return 'super-admin' as const;
    case PrismaAuthRole.STUDENT:
      return 'student' as const;
    case PrismaAuthRole.TEACHER:
      return 'teacher' as const;
  }
}

function normalizeClientIp({ forwardedFor, realIp }: ClientIpHeaders) {
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim();
  const rawIp = firstForwardedIp || realIp?.trim() || 'unknown';
  const normalizedIp = rawIp.replace(/^::ffff:/, '');

  return normalizedIp || 'unknown';
}
