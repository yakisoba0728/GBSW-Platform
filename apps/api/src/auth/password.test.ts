import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password helpers', () => {
  it('hashes and verifies a password', () => {
    const password = 'gbsw-password-1234';
    const hashedPassword = hashPassword(password);

    expect(hashedPassword).not.toBe(password);
    expect(verifyPassword(password, hashedPassword)).toBe(true);
    expect(verifyPassword('wrong-password', hashedPassword)).toBe(false);
  });

  it('returns false for malformed hashes', () => {
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
  });
});
