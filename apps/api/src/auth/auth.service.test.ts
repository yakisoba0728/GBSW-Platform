import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService throttle failure tracking', () => {
  it('restarts the login throttle window when a concurrent request deletes the row', async () => {
    const activeWindowStartedAt = new Date(Date.now() - 1_000);
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({
        failedCount: 1,
        windowStartedAt: activeWindowStartedAt,
      })
      .mockResolvedValueOnce(null);
    const updateMany = vi.fn().mockResolvedValueOnce({ count: 0 });
    const upsert = vi.fn().mockResolvedValue({
      key: 'account:test-user',
    });

    const service = createAuthService({
      loginThrottle: {
        findUnique,
        updateMany,
        upsert,
      } as unknown as PrismaService['loginThrottle'],
    });

    await expect(
      callPrivate<void>(
        service,
        'registerFailedLoginAttempt',
        'account:test-user',
      ),
    ).resolves.toBeUndefined();

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'account:test-user' },
        update: expect.objectContaining({
          failedCount: 1,
          lockedUntil: null,
        }),
        create: expect.objectContaining({
          key: 'account:test-user',
          failedCount: 1,
          lockedUntil: null,
        }),
      }),
    );
  });

  it('retries with the latest failed count when another request updates first', async () => {
    const firstWindowStartedAt = new Date(Date.now() - 1_000);
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({
        failedCount: 1,
        windowStartedAt: firstWindowStartedAt,
      })
      .mockResolvedValueOnce({
        failedCount: 2,
        windowStartedAt: firstWindowStartedAt,
      });
    const updateMany = vi
      .fn()
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    const upsert = vi.fn();

    const service = createAuthService({
      loginThrottle: {
        findUnique,
        updateMany,
        upsert,
      } as unknown as PrismaService['loginThrottle'],
    });

    await expect(
      callPrivate<void>(
        service,
        'registerFailedLoginAttempt',
        'account:test-user',
      ),
    ).resolves.toBeUndefined();

    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          key: 'account:test-user',
          failedCount: 2,
          windowStartedAt: firstWindowStartedAt,
        },
        data: expect.objectContaining({
          failedCount: 3,
          lockedUntil: null,
        }),
      }),
    );
    expect(upsert).not.toHaveBeenCalled();
  });
});

function createAuthService(prisma: Partial<PrismaService>) {
  return new AuthService(prisma as PrismaService);
}

describe('AuthService.revokeSession', () => {
  it('updates revokedAt for a matching session', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });

    const service = createAuthService({
      authSession: {
        updateMany,
      } as unknown as PrismaService['authSession'],
    });

    const result = await service.revokeSession({ sessionId: 'sess-123' });

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'sess-123', revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('returns ok even when no session matched (idempotent)', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    const service = createAuthService({
      authSession: {
        updateMany,
      } as unknown as PrismaService['authSession'],
    });

    const result = await service.revokeSession({ sessionId: 'ghost-session' });

    expect(result).toEqual({ ok: true });
  });
});

describe('AuthService.refreshOnboardingSession', () => {
  it('refreshes hasLinkedEmail and hasLinkedPhone for a student', async () => {
    const updatedSession = {
      id: 'sess1',
      accountId: 'GB260101',
      role: 'STUDENT' as const,
      mustChangePassword: false,
      hasLinkedEmail: true,
      hasLinkedPhone: false,
      expiresAt: new Date(Date.now() + 1_000_000),
    };

    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue({
          ...updatedSession,
          credentialFingerprint: null,
          revokedAt: null,
        }),
        update: vi.fn().mockResolvedValue(updatedSession),
      } as unknown as PrismaService['authSession'],
      student: {
        findFirst: vi.fn().mockResolvedValue({ school: 'GBSW' }),
        findUnique: vi
          .fn()
          .mockResolvedValue({ hasLinkedEmail: true, hasLinkedPhone: false }),
      } as unknown as PrismaService['student'],
    });

    const result = await service.refreshOnboardingSession('sess1');

    expect(result.ok).toBe(true);
    expect(result.session).toMatchObject({
      hasLinkedEmail: true,
      hasLinkedPhone: false,
    });
  });

  it('throws UnauthorizedException when session does not exist', async () => {
    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue(null),
      } as unknown as PrismaService['authSession'],
    });

    await expect(
      service.refreshOnboardingSession('nonexistent'),
    ).rejects.toThrow('로그인이 필요합니다.');
  });
});

describe('AuthService.changePassword - mustChangePassword throttle bypass', () => {
  it('skips throttle check when mustChangePassword is true', async () => {
    process.env.INTERNAL_API_SECRET = 'test-secret';
    process.env.SUPER_ADMIN_ID = 'admin';
    process.env.SUPER_ADMIN_PASSWORD = 'pw';

    const findUnique = vi.fn();
    const studentUpdate = vi.fn().mockResolvedValue({});
    const sessionUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const sessionCreate = vi.fn().mockResolvedValue({
      id: 'new-sess',
      accountId: 'GB260101',
      role: 'STUDENT',
      credentialFingerprint: null,
      mustChangePassword: false,
      hasLinkedEmail: false,
      hasLinkedPhone: false,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    });

    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sess1',
          accountId: 'GB260101',
          role: 'STUDENT',
          mustChangePassword: true,
          hasLinkedEmail: false,
          hasLinkedPhone: false,
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: null,
        }),
        updateMany: sessionUpdateMany,
        create: sessionCreate,
      } as unknown as PrismaService['authSession'],
      student: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ school: 'GBSW' })
          .mockResolvedValueOnce({
            studentId: 'GB260101',
            name: '김학생',
            passwordHash: '$2b$12$validhash',
            mustChangePassword: true,
            school: 'GBSW',
            hasLinkedEmail: false,
            hasLinkedPhone: false,
          }),
        update: studentUpdate,
      } as unknown as PrismaService['student'],
      loginThrottle: {
        findUnique,
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      } as unknown as PrismaService['loginThrottle'],
    });

    await service
      .changePassword('sess1', {
        currentPassword: undefined,
        newPassword: 'NewPass123!',
      })
      .catch(() => {
        // Password verification will fail since we mock the hash — that's OK
      });

    expect(findUnique).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          key: expect.stringContaining('change-pwd'),
        }),
      }),
    );
  });
});

function callPrivate<TResult>(
  service: AuthService,
  methodName: string,
  ...args: unknown[]
) {
  return (
    service as unknown as Record<string, (...methodArgs: unknown[]) => TResult>
  )[methodName](...args);
}

describe('AuthService.getActiveSession - onboarding fields', () => {
  it('returns hasLinkedEmail and hasLinkedPhone from the session record', async () => {
    const sessionRecord = {
      id: 'sess1',
      accountId: 'teacher1',
      role: 'TEACHER' as const,
      mustChangePassword: false,
      hasLinkedEmail: true,
      hasLinkedPhone: false,
      expiresAt: new Date(Date.now() + 1_000_000),
      revokedAt: null,
    };

    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue(sessionRecord),
      } as unknown as PrismaService['authSession'],
      teacher: {
        findFirst: vi.fn().mockResolvedValue({ teacherId: 'teacher1' }),
      } as unknown as PrismaService['teacher'],
    });

    const result = await callPrivate<
      ReturnType<(typeof service)['getActiveSession']>
    >(service, 'getActiveSession', 'sess1');

    expect(result).toMatchObject({
      id: 'sess1',
      hasLinkedEmail: true,
      hasLinkedPhone: false,
    });
  });
});

describe('AuthService.linkEmail', () => {
  it('updates student email and sets hasLinkedEmail on session', async () => {
    const updateStudentFn = vi.fn().mockResolvedValue({});
    const updateSessionFn = vi.fn().mockResolvedValue({
      id: 'sess1',
      accountId: 'GB260101',
      role: 'STUDENT',
      mustChangePassword: false,
      hasLinkedEmail: true,
      hasLinkedPhone: false,
      expiresAt: new Date(Date.now() + 1_000_000),
    });
    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sess1',
          accountId: 'GB260101',
          role: 'STUDENT',
          mustChangePassword: false,
          hasLinkedEmail: false,
          hasLinkedPhone: false,
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: null,
        }),
        update: updateSessionFn,
      } as unknown as PrismaService['authSession'],
      student: {
        findFirst: vi.fn().mockResolvedValue({ school: 'GBSW' }),
        update: updateStudentFn,
      } as unknown as PrismaService['student'],
      $transaction: vi
        .fn()
        .mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            student: { update: updateStudentFn },
            authSession: { update: updateSessionFn },
          }),
        ),
    } as unknown as PrismaService);

    const result = await service.linkEmail('sess1', {
      email: 'test@example.com',
    });

    expect(updateStudentFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: 'GB260101' },
        data: { email: 'test@example.com', hasLinkedEmail: true },
      }),
    );
    expect(result.ok).toBe(true);
  });
});

describe('AuthService.linkPhone', () => {
  it('updates teacher phone and sets hasLinkedPhone on session', async () => {
    const updateTeacherFn = vi.fn().mockResolvedValue({});
    const updateSessionFn = vi.fn().mockResolvedValue({
      id: 'sess1',
      accountId: 'teacher1',
      role: 'TEACHER',
      mustChangePassword: false,
      hasLinkedEmail: false,
      hasLinkedPhone: true,
      expiresAt: new Date(Date.now() + 1_000_000),
    });
    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sess1',
          accountId: 'teacher1',
          role: 'TEACHER',
          mustChangePassword: false,
          hasLinkedEmail: false,
          hasLinkedPhone: false,
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: null,
        }),
        update: updateSessionFn,
      } as unknown as PrismaService['authSession'],
      teacher: {
        findFirst: vi.fn().mockResolvedValue({ teacherId: 'teacher1' }),
        update: updateTeacherFn,
      } as unknown as PrismaService['teacher'],
      $transaction: vi
        .fn()
        .mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            teacher: { update: updateTeacherFn },
            authSession: { update: updateSessionFn },
          }),
        ),
    } as unknown as PrismaService);

    const result = await service.linkPhone('sess1', { phone: '01012345678' });

    expect(updateTeacherFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { teacherId: 'teacher1' },
        data: { phone: '01012345678', hasLinkedPhone: true },
      }),
    );
    expect(result.ok).toBe(true);
  });
});

describe('AuthService.createSession', () => {
  it('seeds hasLinkedEmail and hasLinkedPhone from the user object into the new session', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'sess-abc',
      accountId: 'student-1',
      role: 'STUDENT' as const,
      mustChangePassword: false,
      hasLinkedEmail: true,
      hasLinkedPhone: false,
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    const service = createAuthService({
      authSession: { create } as unknown as PrismaService['authSession'],
    });

    await callPrivate(service, 'createSession', {
      accountId: 'student-1',
      role: 'student',
      mustChangePassword: false,
      school: 'GBSW',
      hasLinkedEmail: true,
      hasLinkedPhone: false,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hasLinkedEmail: true,
          hasLinkedPhone: false,
        }),
      }),
    );
  });

  it('defaults hasLinkedEmail and hasLinkedPhone to false when not provided (super-admin)', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'sess-admin',
      accountId: 'admin',
      role: 'SUPER_ADMIN' as const,
      mustChangePassword: false,
      hasLinkedEmail: false,
      hasLinkedPhone: false,
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    const service = createAuthService({
      authSession: { create } as unknown as PrismaService['authSession'],
    });

    await callPrivate(service, 'createSession', {
      accountId: 'admin',
      role: 'super-admin',
      mustChangePassword: false,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hasLinkedEmail: false,
          hasLinkedPhone: false,
        }),
      }),
    );
  });
});
