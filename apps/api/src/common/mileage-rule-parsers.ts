import { BadRequestException } from '@nestjs/common';
import { parseRequiredTextInput } from './parsers';

export function parseOptionalDisplayOrderInput(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parseRequiredDisplayOrderInput(value);
}

export function parseRequiredDisplayOrderInput(value: unknown) {
  const text = parseRequiredTextInput(value, '표시순서 값을 입력해주세요.');

  if (!/^\d+$/.test(text)) {
    throw new BadRequestException('표시순서 값이 올바르지 않습니다.');
  }

  const parsed = Number.parseInt(text, 10);

  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1000000000) {
    throw new BadRequestException('표시순서 값이 올바르지 않습니다.');
  }

  return parsed;
}

export function validateDateRange(startDate?: Date, endDate?: Date) {
  if (startDate && endDate && startDate > endDate) {
    throw new BadRequestException('조회 시작일은 종료일보다 늦을 수 없습니다.');
  }
}
