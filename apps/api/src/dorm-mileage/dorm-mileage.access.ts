import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import {
  assertSuperAdmin,
  assertStudentExists,
  assertTeacherExists,
} from '../common/auth-access';

export { assertSuperAdmin, assertStudentExists, assertTeacherExists };

export async function assertDormTeacherOnly(
  prisma: PrismaService,
  actorTeacherId: string | undefined,
  actorSessionId: string | undefined,
) {
  const teacher = await assertTeacherExists(
    prisma,
    actorTeacherId,
    actorSessionId,
  );
  const dormTeacher = await prisma.teacher.findFirst({
    where: {
      teacherId: teacher.teacherId,
      isActive: true,
    },
    select: {
      teacherId: true,
      name: true,
      isDormTeacher: true,
    },
  });

  if (!dormTeacher?.isDormTeacher) {
    throw new ForbiddenException(
      '사감 교사만 기숙사 상벌점을 부여할 수 있습니다.',
    );
  }

  return dormTeacher;
}
