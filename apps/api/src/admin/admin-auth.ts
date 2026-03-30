import { UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

export function assertInternalSuperAdmin(
  adminId?: string,
  adminPassword?: string,
) {
  const expectedId = process.env.SUPER_ADMIN_ID ?? 'admin';
  const expectedPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'admin1234';

  if (
    !safeEqual(adminId ?? '', expectedId) ||
    !safeEqual(adminPassword ?? '', expectedPassword)
  ) {
    throw new UnauthorizedException('최고관리자 권한이 필요합니다.');
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
