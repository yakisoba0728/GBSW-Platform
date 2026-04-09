import { describe, it, expect } from 'vitest';
import { safeStringEqual } from './runtime-env';

describe('safeStringEqual', () => {
  it('returns true for equal strings', () => {
    expect(safeStringEqual('hello', 'hello')).toBe(true);
  });

  it('returns false for unequal strings of same length', () => {
    expect(safeStringEqual('hello', 'world')).toBe(false);
  });

  it('returns false for strings of different length', () => {
    expect(safeStringEqual('short', 'longer-string')).toBe(false);
  });

  it('returns false for empty vs non-empty', () => {
    expect(safeStringEqual('', 'a')).toBe(false);
  });

  it('returns true for two empty strings', () => {
    expect(safeStringEqual('', '')).toBe(true);
  });
});
