import { describe, expect, it } from 'vitest';
import {
  parseOptionalDisplayOrderInput,
  parseRequiredDisplayOrderInput,
  validateDateRange,
} from './mileage-rule-parsers';

describe('mileage-rule parser helpers', () => {
  it('parses display order inputs consistently', () => {
    expect(parseOptionalDisplayOrderInput(undefined)).toBeUndefined();
    expect(parseOptionalDisplayOrderInput('')).toBeUndefined();
    expect(parseOptionalDisplayOrderInput('12')).toBe(12);
    expect(parseRequiredDisplayOrderInput('0')).toBe(0);
    expect(parseRequiredDisplayOrderInput('7')).toBe(7);
    expect(parseRequiredDisplayOrderInput('1000000000')).toBe(1000000000);
  });

  it('rejects invalid display order inputs', () => {
    expect(() => parseRequiredDisplayOrderInput('abc')).toThrow(
      '표시순서 값이 올바르지 않습니다.',
    );
    expect(() => parseRequiredDisplayOrderInput('-1')).toThrow(
      '표시순서 값이 올바르지 않습니다.',
    );
    expect(() => parseRequiredDisplayOrderInput('1000000001')).toThrow(
      '표시순서 값이 올바르지 않습니다.',
    );
  });

  it('rejects reversed date ranges', () => {
    expect(() =>
      validateDateRange(new Date('2026-04-10'), new Date('2026-04-09')),
    ).toThrow('조회 시작일은 종료일보다 늦을 수 없습니다.');
  });
});
