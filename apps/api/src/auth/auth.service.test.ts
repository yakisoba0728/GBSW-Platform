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
      },
    });

    await expect(
      callPrivate<void>(service, 'registerFailedLoginAttempt', 'account:test-user'),
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
      },
    });

    await expect(
      callPrivate<void>(service, 'registerFailedLoginAttempt', 'account:test-user'),
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

function createAuthService(
  prisma: Pick<PrismaService, 'loginThrottle'>,
) {
  return new AuthService(prisma as PrismaService);
}

function callPrivate<TResult>(
  service: AuthService,
  methodName: string,
  ...args: unknown[]
) {
  return (
    service as unknown as Record<string, (...methodArgs: unknown[]) => TResult>
  )[methodName](...args);
}
