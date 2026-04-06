import { AuthRole } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { parseRequiredTextInput } from '../common/parsers';

export async function assertTeacherExists(
  prisma: PrismaService,
  actorTeacherId: string | undefined,
) {
  const teacherId = parseRequiredTextInput(
    actorTeacherId,
    '교사 계정 정보가 올바르지 않습니다.',
  );
  const teacher = await prisma.teacher.findUnique({
    where: {
      teacherId,
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

  const teacher = await assertTeacherExists(prisma, actorTeacherId);

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

  return {
    role: 'super-admin' as const,
    accountId: superAdminId,
  };
}

export async function assertStudentExists(
  prisma: PrismaService,
  actorStudentId: string | undefined,
) {
  const studentId = parseRequiredTextInput(
    actorStudentId,
    '학생 계정 정보가 올바르지 않습니다.',
  );
  const student = await prisma.student.findUnique({
    where: {
      studentId,
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
