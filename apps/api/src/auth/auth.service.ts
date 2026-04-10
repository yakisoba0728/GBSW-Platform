import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AuthRole as PrismaAuthRole, School } from '@prisma/client';
import {
  getSuperAdminCredentials,
  safeStringEqual,
} from '../config/runtime-env';
import { parsePhone } from '../admin/admin.parsers';
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
  name: string | null;
  role: 'super-admin' | 'student' | 'teacher';
  mustChangePassword: boolean;
  school?: School;
  hasLinkedEmail?: boolean;
  hasLinkedPhone?: boolean;
};

const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 1000 * 60 * 10;
const CHANGE_PWD_MAX_ATTEMPTS = 5;
const CHANGE_PWD_LOCK_MS = 1000 * 60 * 10; // 10분 잠금

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(body: Record<string, unknown>) {
    const id = parseRequiredText(body.id, '아이디');
    const password = parseRequiredPassword(body.password, '비밀번호');
    const candidates = await this.findLoginCandidates(id);
    const throttleKeys = buildLoginThrottleKeys(id, candidates);
    const cooldownSeconds =
      await this.getRemainingLoginCooldownSecondsForKeys(throttleKeys);

    if (cooldownSeconds > 0) {
      throw new HttpException(
        `로그인 시도가 너무 많습니다. ${cooldownSeconds}초 후 다시 시도해주세요.`,
        429,
      );
    }

    const user = this.findAuthenticatedUser(id, password, candidates);

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
      await this.clearFailedLoginAttempts(
        `change-pwd:${actorSession.accountId}`,
      );
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

  async linkEmail(
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    const sessionId = parseRequiredText(actorSessionId, '세션 아이디');
    const session = await this.getActiveSession(sessionId);

    if (!session) throw new UnauthorizedException('로그인이 필요합니다.');
    if (session.role === 'super-admin')
      throw new BadRequestException(
        '슈퍼관리자는 이메일 연동을 사용할 수 없습니다.',
      );

    const email = parseRequiredText(body.email, '이메일', 255);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('올바른 이메일 형식을 입력해주세요.');
    }

    await this.prisma.$transaction(async (tx) => {
      if (session.role === 'student') {
        await tx.student.update({
          where: { studentId: session.accountId },
          data: { email, hasLinkedEmail: true },
        });
      } else {
        await tx.teacher.update({
          where: { teacherId: session.accountId },
          data: { email, hasLinkedEmail: true },
        });
      }

      await tx.authSession.update({
        where: { id: sessionId },
        data: { hasLinkedEmail: true },
      });
    });

    return { ok: true };
  }

  async linkPhone(
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    const sessionId = parseRequiredText(actorSessionId, '세션 아이디');
    const session = await this.getActiveSession(sessionId);

    if (!session) throw new UnauthorizedException('로그인이 필요합니다.');
    if (session.role === 'super-admin')
      throw new BadRequestException(
        '슈퍼관리자는 전화번호 연동을 사용할 수 없습니다.',
      );

    const phone = parsePhone(body.phone);

    await this.prisma.$transaction(async (tx) => {
      if (session.role === 'student') {
        await tx.student.update({
          where: { studentId: session.accountId },
          data: { phone, hasLinkedPhone: true },
        });
      } else {
        await tx.teacher.update({
          where: { teacherId: session.accountId },
          data: { phone, hasLinkedPhone: true },
        });
      }

      await tx.authSession.update({
        where: { id: sessionId },
        data: { hasLinkedPhone: true },
      });
    });

    return { ok: true };
  }

  async refreshOnboardingSession(actorSessionId: string | undefined) {
    const sessionId = parseRequiredText(actorSessionId, '세션 아이디');
    const session = await this.getActiveSession(sessionId);

    if (!session) throw new UnauthorizedException('로그인이 필요합니다.');

    let hasLinkedEmail = false;
    let hasLinkedPhone = false;

    if (session.role === 'student') {
      const student = await this.prisma.student.findUnique({
        where: { studentId: session.accountId },
        select: { hasLinkedEmail: true, hasLinkedPhone: true },
      });
      hasLinkedEmail = student?.hasLinkedEmail ?? false;
      hasLinkedPhone = student?.hasLinkedPhone ?? false;
    } else if (session.role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { teacherId: session.accountId },
        select: { hasLinkedEmail: true, hasLinkedPhone: true },
      });
      hasLinkedEmail = teacher?.hasLinkedEmail ?? false;
      hasLinkedPhone = teacher?.hasLinkedPhone ?? false;
    }

    const updated = await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { hasLinkedEmail, hasLinkedPhone },
      select: {
        id: true,
        accountId: true,
        role: true,
        mustChangePassword: true,
        hasLinkedEmail: true,
        hasLinkedPhone: true,
        expiresAt: true,
      },
    });

    const school =
      session.role === 'student'
        ? (session as { school?: School }).school
        : undefined;

    return { ok: true, session: serializeSession(updated, school) };
  }

  private async findLoginCandidates(id: string) {
    const [student, teacher] = await Promise.all([
      this.prisma.student.findFirst({
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
          hasLinkedEmail: true,
          hasLinkedPhone: true,
        },
      }),
      this.prisma.teacher.findFirst({
        where: {
          teacherId: id,
          isActive: true,
        },
        select: {
          teacherId: true,
          name: true,
          passwordHash: true,
          mustChangePassword: true,
          hasLinkedEmail: true,
          hasLinkedPhone: true,
        },
      }),
    ]);

    return { student, teacher };
  }

  private findAuthenticatedUser(
    id: string,
    password: string,
    candidates?: Awaited<ReturnType<AuthService['findLoginCandidates']>>,
  ) {
    const superAdmin = this.findAuthenticatedSuperAdmin(id, password);

    if (superAdmin) {
      return superAdmin;
    }

    const student = candidates?.student ?? null;
    const teacher = candidates?.teacher ?? null;

    const matchingStudent: AuthenticatedUser | null =
      student && verifyPassword(password, student.passwordHash)
        ? {
            accountId: student.studentId,
            name: student.name,
            role: 'student' as const,
            mustChangePassword: student.mustChangePassword,
            school: student.school,
            hasLinkedEmail: student.hasLinkedEmail,
            hasLinkedPhone: student.hasLinkedPhone,
          }
        : null;

    const matchingTeacher: AuthenticatedUser | null =
      teacher && verifyPassword(password, teacher.passwordHash)
        ? {
            accountId: teacher.teacherId,
            name: teacher.name,
            role: 'teacher' as const,
            mustChangePassword: teacher.mustChangePassword,
            hasLinkedEmail: teacher.hasLinkedEmail,
            hasLinkedPhone: teacher.hasLinkedPhone,
          }
        : null;

    if (matchingStudent && matchingTeacher) {
      throw new UnauthorizedException(
        '동일한 아이디를 가진 학생/교사 계정이 동시에 존재합니다. 관리자에게 문의해주세요.',
      );
    }

    if (matchingTeacher) return matchingTeacher;
    if (matchingStudent) return matchingStudent;

    return null;
  }

  private findAuthenticatedSuperAdmin(id: string, password: string) {
    const credentials = getSuperAdminCredentials();

    if (
      !safeStringEqual(id, credentials.id) ||
      !safeStringEqual(password, credentials.password)
    ) {
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
        hasLinkedEmail: true,
        hasLinkedPhone: true,
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
      hasLinkedEmail: student.hasLinkedEmail,
      hasLinkedPhone: student.hasLinkedPhone,
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
        hasLinkedEmail: true,
        hasLinkedPhone: true,
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
      hasLinkedEmail: teacher.hasLinkedEmail,
      hasLinkedPhone: teacher.hasLinkedPhone,
    };
  }

  private async createSession(
    user: Pick<
      AuthenticatedUser,
      | 'accountId'
      | 'role'
      | 'mustChangePassword'
      | 'school'
      | 'hasLinkedEmail'
      | 'hasLinkedPhone'
    >,
  ) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const session = await this.prisma.authSession.create({
      data: {
        accountId: user.accountId,
        role: toPrismaAuthRole(user.role),
        credentialFingerprint:
          user.role === 'super-admin'
            ? getSuperAdminCredentialFingerprint()
            : null,
        mustChangePassword: user.mustChangePassword,
        hasLinkedEmail: user.hasLinkedEmail ?? false,
        hasLinkedPhone: user.hasLinkedPhone ?? false,
        expiresAt,
      },
      select: {
        id: true,
        accountId: true,
        role: true,
        credentialFingerprint: true,
        mustChangePassword: true,
        hasLinkedEmail: true,
        hasLinkedPhone: true,
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
        credentialFingerprint: true,
        mustChangePassword: true,
        hasLinkedEmail: true,
        hasLinkedPhone: true,
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

      if (
        session.credentialFingerprint !== getSuperAdminCredentialFingerprint()
      ) {
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
      uniqueKeys(keys).map((key) => this.getRemainingLoginCooldownSeconds(key)),
    );

    return Math.max(0, ...cooldowns);
  }

  private async registerFailedLoginAttempt(key: string) {
    await this.recordThrottleFailure(key, LOGIN_WINDOW_MS, (context) =>
      context.failedCount >= MAX_LOGIN_ATTEMPTS
        ? new Date(context.windowStartedAt.getTime() + LOGIN_WINDOW_MS)
        : null,
    );
  }

  private async registerFailedLoginAttemptForKeys(keys: string[]) {
    await Promise.all(
      uniqueKeys(keys).map((key) => this.registerFailedLoginAttempt(key)),
    );
  }

  private async clearFailedLoginAttempts(key: string) {
    await this.prisma.loginThrottle.deleteMany({
      where: {
        key,
      },
    });
  }

  private async clearFailedLoginAttemptsForKeys(keys: string[]) {
    await Promise.all(
      uniqueKeys(keys).map((key) => this.clearFailedLoginAttempts(key)),
    );
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
    await this.recordThrottleFailure(key, CHANGE_PWD_LOCK_MS, (context) =>
      context.failedCount >= CHANGE_PWD_MAX_ATTEMPTS
        ? new Date(context.now.getTime() + CHANGE_PWD_LOCK_MS)
        : null,
    );
  }

  private async recordThrottleFailure(
    key: string,
    lockWindowMs: number,
    resolveLockedUntil: (context: {
      failedCount: number;
      now: Date;
      windowStartedAt: Date;
    }) => Date | null,
  ): Promise<void> {
    const now = new Date();
    let didUpdate = false;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const existing = await this.prisma.loginThrottle.findUnique({
        where: { key },
        select: { failedCount: true, windowStartedAt: true },
      });

      if (
        !existing ||
        now.getTime() - existing.windowStartedAt.getTime() > lockWindowMs
      ) {
        await this.resetThrottleFailureWindow(key, now);
        return;
      }

      const failedCount = existing.failedCount + 1;
      const lockedUntil = resolveLockedUntil({
        failedCount,
        now,
        windowStartedAt: existing.windowStartedAt,
      });
      const result = await this.prisma.loginThrottle.updateMany({
        where: {
          key,
          failedCount: existing.failedCount,
          windowStartedAt: existing.windowStartedAt,
        },
        data: {
          failedCount,
          lockedUntil,
        },
      });

      if (result.count > 0) {
        didUpdate = true;
        break;
      }
    }

    if (!didUpdate) {
      await this.resetThrottleFailureWindow(key, now);
    }
  }

  private async resetThrottleFailureWindow(
    key: string,
    now: Date,
  ): Promise<void> {
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
  }
}

function serializeSession(
  session: {
    id: string;
    accountId: string;
    role: PrismaAuthRole;
    credentialFingerprint?: string | null;
    mustChangePassword: boolean;
    hasLinkedEmail: boolean;
    hasLinkedPhone: boolean;
    expiresAt: Date;
  },
  school?: School,
) {
  return {
    id: session.id,
    accountId: session.accountId,
    role: fromPrismaAuthRole(session.role),
    mustChangePassword: session.mustChangePassword,
    hasLinkedEmail: session.hasLinkedEmail,
    hasLinkedPhone: session.hasLinkedPhone,
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

function buildLoginThrottleKeys(
  accountId: string,
  candidates: {
    student?: object | null;
    teacher?: object | null;
  },
) {
  const credentials = getSuperAdminCredentials();

  if (accountId === credentials.id) {
    return [`super-admin:${accountId}`];
  }

  if (candidates.student && candidates.teacher) {
    return [`ambiguous:${accountId}`];
  }

  if (candidates.teacher) {
    return [`teacher:${accountId}`];
  }

  if (candidates.student) {
    return [`student:${accountId}`];
  }

  return [`login-id:${accountId}`];
}

function getSuperAdminCredentialFingerprint() {
  const credentials = getSuperAdminCredentials();

  return createHash('sha256')
    .update(`${credentials.id}:${credentials.password}`)
    .digest('hex');
}

function uniqueKeys(keys: string[]) {
  return [...new Set(keys)];
}
