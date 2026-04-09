import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function throwMileageRuleConflictIfNeeded(
  error: unknown,
): asserts error is never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    const target = readUniqueConstraintTarget(error);

    if (target.includes('display_order') || target.includes('displayOrder')) {
      throw new ConflictException('같은 표시 순서가 이미 사용 중입니다.');
    }

    throw new ConflictException(
      '같은 유형의 카테고리/항목명이 이미 존재합니다.',
    );
  }
}

function readUniqueConstraintTarget(
  error: Prisma.PrismaClientKnownRequestError,
) {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target
      .filter((value): value is string => typeof value === 'string')
      .join(',');
  }

  return typeof target === 'string' ? target : '';
}
