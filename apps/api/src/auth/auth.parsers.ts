import { BadRequestException } from '@nestjs/common';
import { parseRequiredTextInput } from '../common/parsers';

export function parseRequiredText(value: unknown, label: string) {
  return parseRequiredTextInput(value, `${label}를 입력해주세요.`);
}

export function parseRequiredPassword(value: unknown, label: string) {
  const password = parsePassword(value);

  if (password.length === 0) {
    throw new BadRequestException(`${label}를 입력해주세요.`);
  }

  return password;
}

export function parsePassword(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  return '';
}

export function parseAccountRole(value: unknown) {
  if (value === 'student' || value === 'teacher') {
    return value;
  }

  throw new BadRequestException('계정 권한 정보가 올바르지 않습니다.');
}

export function validateNewPassword(password: string) {
  if (password.trim().length === 0) {
    throw new BadRequestException(
      '새 비밀번호는 공백만으로 설정할 수 없습니다.',
    );
  }

  if (password.length < 10) {
    throw new BadRequestException('새 비밀번호는 10자 이상이어야 합니다.');
  }
}
