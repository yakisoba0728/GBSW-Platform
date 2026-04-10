import { afterEach, describe, expect, it } from 'vitest';
import { resetApiRuntimeEnvCache } from '../config/runtime-env';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

const originalEnv = {
  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
  SUPER_ADMIN_ID: process.env.SUPER_ADMIN_ID,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
};

afterEach(() => {
  resetApiRuntimeEnvCache();
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('AdminService.createTeacher', () => {
  it('returns a one-time temporary password payload for new teachers', async () => {
    process.env.INTERNAL_API_SECRET = 'test-secret';
    process.env.SUPER_ADMIN_ID = 'super-admin';
    process.env.SUPER_ADMIN_PASSWORD = 'super-admin-password';

    const prisma = {
      student: {
        findUnique: () => Promise.resolve(null),
      },
      teacher: {
        create: () => {
          return Promise.resolve({
            teacherId: 'teacher01',
            name: '홍길동',
            phone: null,
            isDormTeacher: false,
            isActive: true,
          });
        },
      },
    } as unknown as PrismaService;

    const service = new AdminService(prisma);
    const result = await service.createTeacher({
      teacherId: 'teacher01',
      name: '홍길동',
    });

    expect(result.teacher.mustChangePassword).toBe(true);
    expect(result.teacher.temporaryPassword).toBe('teacher01');
  });
});
