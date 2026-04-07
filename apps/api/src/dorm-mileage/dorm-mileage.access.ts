import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { parseRequiredTextInput } from '../common/parsers';
import { assertSuperAdmin, assertStudentExists } from '../school-mileage/school-mileage.access';

export { assertSuperAdmin, assertStudentExists };

export async function assertDormTeacherOnly(
  prisma: PrismaService,
  actorTeacherId: string | undefined,
) {
  const teacher = await prisma.teacher.findUnique({
    where: {
      teacherId: parseRequiredTextInput(
        actorTeacherId,
        '교사 계정 정보가 올바르지 않습니다.',
      ),
    },
    select: {
      teacherId: true,
      name: true,
      isDormTeacher: true,
    },
  });

  if (!teacher) {
    throw new UnauthorizedException('유효한 교사 계정이 아닙니다.');
  }

  if (!teacher.isDormTeacher) {
    throw new ForbiddenException('사감 교사만 기숙사 상벌점을 부여할 수 있습니다.');
  }

  return teacher;
}

export async function assertDormTeacherReadAccess(
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


