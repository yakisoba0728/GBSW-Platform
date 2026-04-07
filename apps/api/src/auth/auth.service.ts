import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRole as PrismaAuthRole, School } from '@prisma/client';
import { getSuperAdminCredentials } from '../config/runtime-env';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password';
import {
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
  school?: School;
};

type ClientIpHeaders = {
  realIp?: string;
};

const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 1000 * 60 * 10;
const CHANGE_PWD_MAX_ATTEMPTS = 5;
const CHANGE_PWD_LOCK_MS = 1000 * 60 * 10; // 10분 잠금

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(body: Record<string, unknown>, clientIpHeaders: ClientIpHeaders) {
    const id = parseRequiredText(body.id, '아이디');
    const password = parseRequiredPassword(body.password, '비밀번호');
    const clientIp = normalizeClientIp(clientIpHeaders);
    const throttleKeys = buildLoginThrottleKeys(id, clientIp);
    const cooldownSeconds =
      await this.getRemainingLoginCooldownSecondsForKeys(throttleKeys);

    if (cooldownSeconds > 0) {
      throw new HttpException(
        `로그인 시도가 너무 많습니다. ${cooldownSeconds}초 후 다시 시도해주세요.`,
        429,
      );
    }

    const user = await this.findAuthenticatedUser(id, password);

    if (!user) {
      await this.registerFailedLoginAttemptForKeys(throttleKeys);
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    await this.clearFailedLoginAttemptsForKeys(throttleKeys);
    const session = await this.createSession(user);

    return {
      ok: true,
      user,
      session,
    };
  }

  async changePassword(
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    const sessionId = parseRequiredText(actorSessionId, '세션 아이디');
    const actorSession = await this.getActiveSession(sessionId);

    if (!actorSession) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    if (actorSession.role === 'super-admin') {
      throw new BadRequestException(
        '최고관리자 비밀번호 변경은 지원하지 않습니다.',
      );
    }

    // 비밀번호 변경 시도 횟수 제한 (first-login 제외)
    if (!actorSession.mustChangePassword) {
      const throttleKey = `change-pwd:${actorSession.accountId}`;
      const lockedSeconds =
        await this.getChangePasswordCooldownSeconds(throttleKey);

      if (lockedSeconds > 0) {
        throw new HttpException(
          `비밀번호 변경 시도가 너무 많습니다. ${lockedSeconds}초 후 다시 시도해주세요.`,
          429,
        );
      }
    }

    const currentPassword = actorSession.mustChangePassword
      ? parsePassword(body.currentPassword)
      : parseRequiredPassword(body.currentPassword, '현재 비밀번호');
    const newPassword = parseRequiredPassword(body.newPassword, '새 비밀번호');

    validateNewPassword(newPassword);

    const user =
      actorSession.role === 'student'
        ? await this.changeStudentPassword(
            actorSession.accountId,
            currentPassword,
            newPassword,
            actorSession.mustChangePassword,
          )
        : await this.changeTeacherPassword(
            actorSession.accountId,
            currentPassword,
            newPassword,
            actorSession.mustChangePassword,
          );

    if (!actorSession.mustChangePassword) {
      await this.clearFailedLoginAttempts(`change-pwd:${actorSession.accountId}`);
    }

    await this.revokeAllSessionsForAccount(user.accountId, user.role);
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

    const student = await this.prisma.student.findFirst({
      where: {
        studentId: id,
        isActive: true,
      },
      select: {
        studentId: true,
        name: true,
        passwordHash: true,
        mustChangePassword: true,
        school: true,
      },
    });

    if (student && verifyPassword(password, student.passwordHash)) {
      return {
        accountId: student.studentId,
        name: student.name,
        role: 'student',
        mustChangePassword: student.mustChangePassword,
        school: student.school,
      } satisfies AuthenticatedUser;
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: {
        teacherId: id,
        isActive: true,
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
    const student = await this.prisma.student.findFirst({
      where: {
        studentId: accountId,
        isActive: true,
      },
      select: {
        studentId: true,
        name: true,
        passwordHash: true,
        mustChangePassword: true,
        school: true,
      },
    });

    const canSkipCurrentPassword =
      allowMissingCurrentPassword && student?.mustChangePassword === true;

    if (
      !student ||
      (!canSkipCurrentPassword &&
        !verifyPassword(currentPassword, student.passwordHash))
    ) {
      if (student && !allowMissingCurrentPassword) {
        await this.recordChangePasswordFailure(`change-pwd:${accountId}`);
      }
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
      school: student.school,
    };
  }

  private async changeTeacherPassword(
    accountId: string,
    currentPassword: string,
    newPassword: string,
    allowMissingCurrentPassword: boolean,
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        teacherId: accountId,
        isActive: true,
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
      if (teacher && !allowMissingCurrentPassword) {
        await this.recordChangePasswordFailure(`change-pwd:${accountId}`);
      }
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
    user: Pick<
      AuthenticatedUser,
      'accountId' | 'role' | 'mustChangePassword' | 'school'
    >,
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

    return serializeSession(session, user.school);
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
      await this.revokeSessionById(normalizedSessionId);

      return null;
    }

    if (session.role === PrismaAuthRole.STUDENT) {
      const student = await this.prisma.student.findFirst({
        where: {
          studentId: session.accountId,
          isActive: true,
        },
        select: {
          school: true,
        },
      });

      if (!student) {
        await this.revokeSessionById(normalizedSessionId);
        return null;
      }

      return serializeSession(session, student.school);
    }

    if (session.role === PrismaAuthRole.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          teacherId: session.accountId,
          isActive: true,
        },
        select: {
          teacherId: true,
        },
      });

      if (!teacher) {
        await this.revokeSessionById(normalizedSessionId);
        return null;
      }

      return serializeSession(session);
    }

    if (session.role === PrismaAuthRole.SUPER_ADMIN) {
      const credentials = getSuperAdminCredentials();

      if (session.accountId !== credentials.id) {
        await this.revokeSessionById(normalizedSessionId);
        return null;
      }

      return serializeSession(session);
    }

    return serializeSession(session);
  }

  private async revokeAllSessionsForAccount(
    accountId: string,
    role: 'student' | 'teacher' | 'super-admin',
  ) {
    await this.prisma.authSession.updateMany({
      where: {
        accountId,
        role: toPrismaAuthRole(role),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async revokeSessionById(sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
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

  private async getRemainingLoginCooldownSecondsForKeys(keys: string[]) {
    const cooldowns = await Promise.all(
      keys.map((key) => this.getRemainingLoginCooldownSeconds(key)),
    );

    return Math.max(0, ...cooldowns);
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

  private async registerFailedLoginAttemptForKeys(keys: string[]) {
    await Promise.all(keys.map((key) => this.registerFailedLoginAttempt(key)));
  }

  private async clearFailedLoginAttempts(key: string) {
    await this.prisma.loginThrottle.deleteMany({
      where: {
        key,
      },
    });
  }

  private async clearFailedLoginAttemptsForKeys(keys: string[]) {
    await Promise.all(keys.map((key) => this.clearFailedLoginAttempts(key)));
  }

  private async getChangePasswordCooldownSeconds(key: string): Promise<number> {
    const throttle = await this.prisma.loginThrottle.findUnique({
      where: { key },
      select: { failedCount: true, lockedUntil: true },
    });

    if (!throttle?.lockedUntil) {
      return 0;
    }

    const now = Date.now();

    if (
      throttle.lockedUntil.getTime() > now &&
      throttle.failedCount >= CHANGE_PWD_MAX_ATTEMPTS
    ) {
      return Math.ceil((throttle.lockedUntil.getTime() - now) / 1000);
    }

    return 0;
  }

  private async recordChangePasswordFailure(key: string): Promise<void> {
    const now = new Date();
    const existing = await this.prisma.loginThrottle.findUnique({
      where: { key },
      select: { failedCount: true, windowStartedAt: true },
    });

    if (
      !existing ||
      now.getTime() - existing.windowStartedAt.getTime() > CHANGE_PWD_LOCK_MS
    ) {
      await this.prisma.loginThrottle.upsert({
        where: { key },
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
      failedCount >= CHANGE_PWD_MAX_ATTEMPTS
        ? new Date(now.getTime() + CHANGE_PWD_LOCK_MS)
        : null;

    await this.prisma.loginThrottle.update({
      where: { key },
      data: {
        failedCount,
        lockedUntil,
      },
    });
  }
}

function serializeSession(
  session: {
    id: string;
    accountId: string;
    role: PrismaAuthRole;
    mustChangePassword: boolean;
    expiresAt: Date;
  },
  school?: School,
) {
  return {
    id: session.id,
    accountId: session.accountId,
    role: fromPrismaAuthRole(session.role),
    mustChangePassword: session.mustChangePassword,
    expiresAt: session.expiresAt.toISOString(),
    ...(school ? { school } : {}),
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

function normalizeClientIp({ realIp }: ClientIpHeaders) {
  const rawIp = realIp?.trim();

  if (!rawIp) {
    return null;
  }

  const normalizedIp = rawIp.replace(/^::ffff:/, '').trim();

  return normalizedIp.length > 0 ? normalizedIp : null;
}

function buildLoginThrottleKeys(accountId: string, clientIp: string | null) {
  return clientIp
    ? [`account:${accountId}`, `ip:${clientIp}`]
    : [`account:${accountId}`];
}
