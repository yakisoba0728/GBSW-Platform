import { UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getInternalApiSecret } from '../config/runtime-env';

export function assertInternalApiRequest(providedSecret?: string) {
  const internalApiSecret = getInternalApiSecret();

  if (!safeEqual(providedSecret ?? '', internalApiSecret)) {
    throw new UnauthorizedException('내부 API 인증에 실패했습니다.');
  }
}

function safeEqual(left: string, right: string) {
  // 길이 차이로 secret 길이가 유출되지 않도록 양쪽을 SHA-256으로 해시한 뒤 비교
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();

  return timingSafeEqual(leftHash, rightHash);
}
