import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MileageScope } from '@prisma/client';
import { resetApiRuntimeEnvCache } from '../config/runtime-env';
import type { PrismaService } from '../prisma/prisma.service';
import { MileageRulesService } from './mileage.rules.service';

const originalEnv = {
  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
  SUPER_ADMIN_ID: process.env.SUPER_ADMIN_ID,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
};

afterEach(() => {
  resetApiRuntimeEnvCache();
  restoreEnv('INTERNAL_API_SECRET');
  restoreEnv('SUPER_ADMIN_ID');
  restoreEnv('SUPER_ADMIN_PASSWORD');
});

describe('MileageRulesService.updateRule', () => {
  it('rejects cross-scope updates before mutating the rule', async () => {
    setRuntimeEnv();

    const prisma = {
      authSession: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'session-1',
          credentialFingerprint: createHash('sha256')
            .update('super-admin:super-admin-password')
            .digest('hex'),
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      mileageRule: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10,
          scope: MileageScope.SCHOOL,
          type: 'REWARD',
          category: '생활',
          name: '청결',
          defaultScore: 5,
          displayOrder: 1,
          isActive: true,
          minScore: null,
          maxScore: null,
        }),
      },
    } as unknown as PrismaService;

    const service = new MileageRulesService(prisma);

    await expect(
      service.updateRule(MileageScope.DORM, 'super-admin', 'session-1', '10', {
        name: '정리',
      }),
    ).rejects.toThrow('상벌점 항목을 찾을 수 없습니다.');
  });
});

function setRuntimeEnv() {
  process.env.INTERNAL_API_SECRET = 'test-internal-secret';
  process.env.SUPER_ADMIN_ID = 'super-admin';
  process.env.SUPER_ADMIN_PASSWORD = 'super-admin-password';
}

function restoreEnv(name: keyof typeof originalEnv) {
  const value = originalEnv[name];

  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
