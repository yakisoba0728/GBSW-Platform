import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { parseRequiredTextInput } from '../common/parsers';
import { getApiRuntimeEnv } from '../config/runtime-env';

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
) {
  if (typeof actorSuperAdminId === 'string' && actorSuperAdminId.trim()) {
    const { SUPER_ADMIN_ID } = getApiRuntimeEnv();
    const superAdminId = actorSuperAdminId.trim();

    if (superAdminId !== SUPER_ADMIN_ID) {
      throw new UnauthorizedException('유효한 최고관리자 계정이 아닙니다.');
    }

    return {
      role: 'super-admin' as const,
      accountId: superAdminId,
    };
  }

  const teacher = await assertTeacherExists(prisma, actorTeacherId);

  return {
    role: 'teacher' as const,
    accountId: teacher.teacherId,
  };
}

export function assertSuperAdmin(
  actorSuperAdminId: string | undefined,
) {
  const { SUPER_ADMIN_ID } = getApiRuntimeEnv();
  const superAdminId = parseRequiredTextInput(
    actorSuperAdminId,
    '최고관리자 계정 정보가 올바르지 않습니다.',
  );

  if (superAdminId !== SUPER_ADMIN_ID) {
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
