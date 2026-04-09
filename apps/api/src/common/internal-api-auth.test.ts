import { afterEach, describe, expect, it } from 'vitest';
import { resetApiRuntimeEnvCache } from '../config/runtime-env';
import { assertInternalApiRequest } from './internal-api-auth';

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

describe('assertInternalApiRequest', () => {
  it('accepts a matching secret', () => {
    process.env.INTERNAL_API_SECRET = 'test-internal-secret';
    process.env.SUPER_ADMIN_ID = 'super-admin';
    process.env.SUPER_ADMIN_PASSWORD = 'super-admin-password';

    expect(() =>
      assertInternalApiRequest('test-internal-secret'),
    ).not.toThrow();
  });

  it('rejects a mismatched secret', () => {
    process.env.INTERNAL_API_SECRET = 'test-internal-secret';
    process.env.SUPER_ADMIN_ID = 'super-admin';
    process.env.SUPER_ADMIN_PASSWORD = 'super-admin-password';

    expect(() => assertInternalApiRequest('wrong-secret')).toThrow(
      '내부 API 인증에 실패했습니다.',
    );
  });

  it('rejects when the secret is missing', () => {
    process.env.INTERNAL_API_SECRET = 'test-internal-secret';
    process.env.SUPER_ADMIN_ID = 'super-admin';
    process.env.SUPER_ADMIN_PASSWORD = 'super-admin-password';

    expect(() => assertInternalApiRequest()).toThrow(
      '내부 API 인증에 실패했습니다.',
    );
  });
});

function restoreEnv(name: keyof typeof originalEnv) {
  const value = originalEnv[name];

  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
