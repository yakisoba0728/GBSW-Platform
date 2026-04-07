import { BadRequestException } from '@nestjs/common';

export function toInputText(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}`.trim();
  }

  if (Array.isArray(value) && value.length > 0) {
    return toInputText(value[0]);
  }

  return '';
}

export function parseRequiredTextInput(
  value: unknown,
  message: string,
  maxLength?: number,
) {
  const text = toInputText(value);

  if (!text) {
    throw new BadRequestException(message);
  }

  if (maxLength !== undefined && text.length > maxLength) {
    throw new BadRequestException(`최대 ${maxLength}자까지 입력할 수 있습니다.`);
  }

  return text;
}

export function parseOptionalTextInput(value: unknown, maxLength?: number) {
  const text = toInputText(value);

  if (!text) {
    return undefined;
  }

  if (maxLength !== undefined && text.length > maxLength) {
    throw new BadRequestException(`최대 ${maxLength}자까지 입력할 수 있습니다.`);
  }

  return text;
}

export function parseRequiredPositiveIntInput(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  const text = toInputText(value);
  const parsed = Number.parseInt(text, 10);

  if (
    !/^\d+$/.test(text) ||
    Number.isNaN(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    throw new BadRequestException(`${label} 값이 올바르지 않습니다.`);
  }

  return parsed;
}

export function parseOptionalPositiveIntInput(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parseRequiredPositiveIntInput(value, label, min, max);
}

export function parseDateString(value: string, direction: 'start' | 'end') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const suffix =
      direction === 'end' ? 'T23:59:59.999+09:00' : 'T00:00:00.000+09:00';
    const parsed = new Date(`${value}${suffix}`);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('날짜 형식이 올바르지 않습니다.');
  }

  return parsed;
}

export function parseOptionalDateInput(
  value: unknown,
  direction: 'start' | 'end',
) {
  const text = parseOptionalTextInput(value);

  if (!text) {
    return undefined;
  }

  return parseDateString(text, direction);
}

export function parseRequiredDateInput(value: unknown, label: string) {
  const text = parseOptionalTextInput(value);

  if (!text) {
    throw new BadRequestException(`${label}를 입력해주세요.`);
  }

  return parseDateString(text, 'start');
}
