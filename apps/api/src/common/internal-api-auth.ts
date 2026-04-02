import { UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { getApiRuntimeEnv } from '../config/runtime-env';

export function assertInternalApiRequest(providedSecret?: string) {
  const { INTERNAL_API_SECRET } = getApiRuntimeEnv();

  if (!safeEqual(providedSecret ?? '', INTERNAL_API_SECRET)) {
    throw new UnauthorizedException('내부 API 인증에 실패했습니다.');
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
