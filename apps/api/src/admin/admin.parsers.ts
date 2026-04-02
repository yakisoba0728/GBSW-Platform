import { BadRequestException } from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import {
  parseRequiredPositiveIntInput,
  parseRequiredTextInput,
  toInputText,
} from '../common/parsers';

export function parseSchool(value: unknown): School {
  if (value === School.GBSW || value === School.BYMS) {
    return value;
  }

  throw new BadRequestException('학교 정보가 올바르지 않습니다.');
}

export function parseYear(value: unknown) {
  return parseYearWithLabel(value, '입학년도');
}

export function parseYearWithLabel(value: unknown, label: string) {
  const year = parsePositiveInt(value, label, 2000, 2099);

  if (`${year}`.length !== 4) {
    throw new BadRequestException(`${label}는 4자리로 입력해주세요.`);
  }

  return year;
}

export function parsePositiveInt(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  return parseRequiredPositiveIntInput(value, label, min, max);
}

export function parseRequiredText(value: unknown, label: string) {
  return parseRequiredTextInput(value, `${label}을 입력해주세요.`);
}

export function parsePhone(value: unknown) {
  const phone = toInputText(value);
  const digits = extractPhoneDigits(phone);

  if (!/^010\d{8}$/.test(digits)) {
    throw new BadRequestException(
      '전화번호는 010-0000-0000 형식으로 입력해주세요.',
    );
  }

  return digits;
}

export function parseTeacherId(value: unknown) {
  const teacherId = toInputText(value);

  if (!teacherId) {
    throw new BadRequestException('교사 아이디를 입력해주세요.');
  }

  if (!/^[A-Za-z0-9._-]{4,30}$/.test(teacherId)) {
    throw new BadRequestException(
      '교사 아이디는 4~30자의 영문, 숫자, ., _, - 만 사용할 수 있습니다.',
    );
  }

  return teacherId;
}

export function parseMajorSubject(value: unknown) {
  const majorSubject = toInputText(value);

  if (!majorSubject) {
    throw new BadRequestException('전공과목을 입력하거나 선택해주세요.');
  }

  return majorSubject;
}

export function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true';
  }

  return false;
}

export function buildStudentId(
  school: School,
  admissionYear: number,
  classNumber: number,
  studentNumber: number,
) {
  const prefix = school === School.GBSW ? 'GB' : 'BY';
  const year = `${admissionYear}`.slice(-2);

  return `${prefix}${year}${pad(classNumber)}${pad(studentNumber)}`;
}

export function buildTemporaryPassword(accountId: string, phone: string) {
  return `${accountId}${phone.slice(-4)}`;
}

export function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function extractPhoneDigits(phone: string) {
  return phone.replaceAll(/\D/g, '');
}

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}
