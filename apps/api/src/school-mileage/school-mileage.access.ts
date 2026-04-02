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
