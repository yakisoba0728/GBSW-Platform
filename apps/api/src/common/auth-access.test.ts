import { afterEach, describe, expect, it } from 'vitest';
import { resetApiRuntimeEnvCache } from '../config/runtime-env';
import {
  assertStudentExists,
  assertSuperAdmin,
  assertTeacherExists,
  assertTeacherOrSuperAdmin,
} from './auth-access';

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

describe('auth-access helpers', () => {
  it('allows active teachers with a live session', async () => {
    const prisma = {
      authSession: {
        findFirst: () => Promise.resolve({ id: 'session-1' }),
      },
      teacher: {
        findFirst: () =>
          Promise.resolve({
            teacherId: 'teacher-1',
            name: '담당 교사',
          }),
      },
    };

    await expect(
      assertTeacherExists(prisma as never, 'teacher-1', 'session-1'),
    ).resolves.toEqual({
      teacherId: 'teacher-1',
      name: '담당 교사',
    });
  });

  it('rejects inactive students even when the session is valid', async () => {
    const prisma = {
      authSession: {
        findFirst: () => Promise.resolve({ id: 'session-1' }),
      },
      student: {
        findFirst: () => Promise.resolve(null),
      },
    };

    await expect(
      assertStudentExists(prisma as never, 'GB240101', 'session-1'),
    ).rejects.toThrow('유효한 학생 계정이 아닙니다.');
  });

  it('accepts a matching super-admin credential set', async () => {
    setRuntimeEnv();

    const prisma = {
      authSession: {
        findFirst: () => Promise.resolve({ id: 'session-1' }),
      },
    };

    await expect(
      assertSuperAdmin(prisma as never, 'super-admin', 'session-1'),
    ).resolves.toEqual({
      role: 'super-admin',
      accountId: 'super-admin',
    });
  });

  it('routes blank super-admin headers through the teacher path', async () => {
    const prisma = {
      authSession: {
        findFirst: () => Promise.resolve({ id: 'session-1' }),
      },
      teacher: {
        findFirst: () =>
          Promise.resolve({
            teacherId: 'teacher-1',
            name: '담당 교사',
          }),
      },
    };

    await expect(
      assertTeacherOrSuperAdmin(
        prisma as never,
        'teacher-1',
        '   ',
        'session-1',
      ),
    ).resolves.toEqual({
      role: 'teacher',
      accountId: 'teacher-1',
    });
  });

  it('rejects a mismatched super-admin account id', async () => {
    setRuntimeEnv();

    const prisma = {
      authSession: {
        findFirst: () => Promise.resolve({ id: 'session-1' }),
      },
    };

    await expect(
      assertSuperAdmin(prisma as never, 'other-admin', 'session-1'),
    ).rejects.toThrow('유효한 최고관리자 계정이 아닙니다.');
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
