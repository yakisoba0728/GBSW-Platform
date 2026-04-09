import { UnauthorizedException } from '@nestjs/common';
import { AuthRole } from '@prisma/client';
import { getSuperAdminCredentials } from '../config/runtime-env';
import { PrismaService } from '../prisma/prisma.service';
import { parseRequiredTextInput } from './parsers';

export async function assertTeacherExists(
  prisma: PrismaService,
  actorTeacherId: string | undefined,
  actorSessionId: string | undefined,
) {
  const teacherId = parseRequiredTextInput(
    actorTeacherId,
    '교사 계정 정보가 올바르지 않습니다.',
  );
  await assertActiveSession(
    prisma,
    teacherId,
    AuthRole.TEACHER,
    actorSessionId,
    '교사 세션 정보가 올바르지 않습니다.',
  );
  const teacher = await prisma.teacher.findFirst({
    where: {
      teacherId,
      isActive: true,
    },
    select: {
      teacherId: true,
      name: true,
    },
  });

  if (!teacher) {
    throw new UnauthorizedException('유효한 교사 계정이 아닙니다.');
  }

  return teacher;
}

export async function assertTeacherOrSuperAdmin(
  prisma: PrismaService,
  actorTeacherId: string | undefined,
  actorSuperAdminId: string | undefined,
  actorSessionId: string | undefined,
) {
  if (typeof actorSuperAdminId === 'string' && actorSuperAdminId.trim()) {
    return assertSuperAdmin(prisma, actorSuperAdminId, actorSessionId);
  }

  const teacher = await assertTeacherExists(
    prisma,
    actorTeacherId,
    actorSessionId,
  );

  return {
    role: 'teacher' as const,
    accountId: teacher.teacherId,
  };
}

export async function assertSuperAdmin(
  prisma: PrismaService,
  actorSuperAdminId: string | undefined,
  actorSessionId: string | undefined,
) {
  const superAdminId = parseRequiredTextInput(
    actorSuperAdminId,
    '최고관리자 계정 정보가 올바르지 않습니다.',
  );
  const sessionId = parseRequiredTextInput(
    actorSessionId,
    '최고관리자 세션 정보가 올바르지 않습니다.',
  );

  const session = await prisma.authSession.findFirst({
    where: {
      id: sessionId,
      accountId: superAdminId,
      role: AuthRole.SUPER_ADMIN,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    throw new UnauthorizedException('유효한 최고관리자 계정이 아닙니다.');
  }

  const credentials = getSuperAdminCredentials();

  if (superAdminId !== credentials.id) {
    throw new UnauthorizedException('유효한 최고관리자 계정이 아닙니다.');
  }

  return {
    role: 'super-admin' as const,
    accountId: superAdminId,
  };
}

export async function assertStudentExists(
  prisma: PrismaService,
  actorStudentId: string | undefined,
  actorSessionId: string | undefined,
) {
  const studentId = parseRequiredTextInput(
    actorStudentId,
    '학생 계정 정보가 올바르지 않습니다.',
  );
  await assertActiveSession(
    prisma,
    studentId,
    AuthRole.STUDENT,
    actorSessionId,
    '학생 세션 정보가 올바르지 않습니다.',
  );
  const student = await prisma.student.findFirst({
    where: {
      studentId,
      isActive: true,
    },
    select: {
      studentId: true,
      name: true,
      school: true,
      currentYear: true,
      currentClass: true,
      currentNumber: true,
    },
  });

  if (!student) {
    throw new UnauthorizedException('유효한 학생 계정이 아닙니다.');
  }

  return student;
}

async function assertActiveSession(
  prisma: PrismaService,
  accountId: string,
  role: AuthRole,
  actorSessionId: string | undefined,
  invalidSessionMessage: string,
) {
  const sessionId = parseRequiredTextInput(
    actorSessionId,
    invalidSessionMessage,
  );
  const session = await prisma.authSession.findFirst({
    where: {
      id: sessionId,
      accountId,
      role,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    throw new UnauthorizedException('유효한 세션이 아닙니다.');
  }
}
