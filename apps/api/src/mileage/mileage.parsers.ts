import { BadRequestException } from '@nestjs/common';
import { MileageScope, School } from '@prisma/client';
import {
  parseOptionalDisplayOrderInput,
  parseRequiredDisplayOrderInput,
  validateDateRange,
} from '../common/mileage-rule-parsers';
import {
  parseOptionalDateInput,
  parseOptionalPositiveIntInput,
  parseOptionalTextInput,
  parseRequiredDateInput,
  parseRequiredPositiveIntInput,
  parseRequiredTextInput,
} from '../common/parsers';
import type {
  CreateRuleInput,
  CreateEntryInput,
  EntryFilterOptions,
  PaginatedEntryFilterOptions,
  MileageApiType,
  StudentFilterOptions,
  UpdateRuleInput,
  UpdateEntryInput,
} from './mileage.types';

export function parseScopeParam(scope: string): MileageScope {
  if (scope === 'school-mileage') {
    return MileageScope.SCHOOL;
  }

  if (scope === 'dorm-mileage') {
    return MileageScope.DORM;
  }

  throw new BadRequestException('유효하지 않은 마일리지 범위입니다.');
}

export function parseStudentFilters(
  scope: MileageScope,
  query: Record<string, unknown>,
): StudentFilterOptions {
  return {
    school:
      scope === MileageScope.DORM
        ? undefined
        : parseOptionalSchool(query.school),
    grade: parseOptionalPositiveIntInput(
      query.grade ?? query.year,
      '학년',
      1,
      3,
    ),
    classNumber: parseOptionalPositiveIntInput(
      query.classNumber ?? query.class,
      '반',
      1,
      99,
    ),
    name: parseOptionalTextInput(query.name ?? query.studentName),
    studentId: parseOptionalTextInput(query.studentId),
  };
}

export function parseEntryFilters(
  scope: MileageScope,
  query: Record<string, unknown>,
): PaginatedEntryFilterOptions {
  const startDate = parseOptionalDateInput(query.startDate, 'start');
  const endDate = parseOptionalDateInput(query.endDate, 'end');

  validateDateRange(startDate, endDate);

  return {
    ...parseStudentFilters(scope, query),
    type: parseOptionalMileageType(query.type),
    studentName: parseOptionalTextInput(query.studentName ?? query.name),
    startDate,
    endDate,
    page: parseOptionalPositiveIntInput(query.page, '페이지', 1, 100000) ?? 1,
    pageSize:
      parseOptionalPositiveIntInput(query.pageSize, '페이지 크기', 1, 100) ??
      20,
  };
}

export function parseAnalyticsFilters(
  scope: MileageScope,
  query: Record<string, unknown>,
): EntryFilterOptions {
  const startDate = parseOptionalDateInput(query.startDate, 'start');
  const endDate = parseOptionalDateInput(query.endDate, 'end');

  validateDateRange(startDate, endDate);

  return {
    ...parseStudentFilters(scope, query),
    studentName: parseOptionalTextInput(query.studentName ?? query.name),
    startDate,
    endDate,
  };
}

export function parseCreateEntryInput(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException('부여할 상벌점 내역이 없습니다.');
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException(
        `${index + 1}번째 상벌점 내역 형식이 올바르지 않습니다.`,
      );
    }

    const entry = item as Record<string, unknown>;

    return {
      studentId: parseRequiredTextInput(
        entry.studentId,
        '학생 아이디 정보가 올바르지 않습니다.',
      ),
      ruleId: parseRequiredPositiveIntInput(
        entry.ruleId,
        '상벌점 항목',
        1,
        1000000000,
      ),
      score: parseRequiredPositiveIntInput(entry.score, '점수', 1, 1000000000),
      reason: parseOptionalTextInput(entry.reason, 500) ?? null,
    } satisfies CreateEntryInput;
  });
}

export function parseUpdateEntryInput(body: Record<string, unknown>) {
  const hasRuleId = body.ruleId !== undefined;
  const hasScore = body.score !== undefined;
  const hasReason = body.reason !== undefined;
  const hasAwardedAt = body.awardedAt !== undefined;

  if (!hasRuleId && !hasScore && !hasReason && !hasAwardedAt) {
    throw new BadRequestException('수정할 항목이 없습니다.');
  }

  return {
    ruleId: hasRuleId
      ? parseRequiredPositiveIntInput(body.ruleId, '상벌점 항목', 1, 1000000000)
      : undefined,
    score: hasScore
      ? parseRequiredPositiveIntInput(body.score, '점수', 1, 1000000000)
      : undefined,
    reasonProvided: hasReason,
    reason: hasReason
      ? (parseOptionalTextInput(body.reason, 500) ?? null)
      : undefined,
    awardedAt: hasAwardedAt
      ? parseRequiredDateInput(body.awardedAt, '부여 일시')
      : undefined,
  } satisfies UpdateEntryInput;
}

export function parseCreateRuleInput(
  scope: MileageScope,
  body: Record<string, unknown>,
) {
  const base = {
    type: parseRequiredMileageType(body.type),
    category: parseRequiredTextInput(
      body.category,
      '카테고리를 입력해주세요.',
      50,
    ),
    name: parseRequiredTextInput(body.name, '항목명을 입력해주세요.', 100),
    defaultScore: parseRequiredPositiveIntInput(
      body.defaultScore,
      '기본점수',
      1,
      1000000000,
    ),
    displayOrder: parseOptionalDisplayOrderInput(body.displayOrder),
  };

  const minScore =
    scope === MileageScope.DORM
      ? parseOptionalScoreInput(body.minScore, '최소점수')
      : undefined;
  const maxScore =
    scope === MileageScope.DORM
      ? parseOptionalScoreInput(body.maxScore, '최대점수')
      : undefined;

  validateScoreWithinRange(base.defaultScore, minScore, maxScore, '기본점수');

  return {
    ...base,
    minScore,
    maxScore,
  } satisfies CreateRuleInput;
}

export function parseUpdateRuleInput(
  scope: MileageScope,
  body: Record<string, unknown>,
) {
  const hasCategory = body.category !== undefined;
  const hasName = body.name !== undefined;
  const hasDefaultScore = body.defaultScore !== undefined;
  const hasDisplayOrder = body.displayOrder !== undefined;
  const hasMinScore =
    scope === MileageScope.DORM && body.minScore !== undefined;
  const hasMaxScore =
    scope === MileageScope.DORM && body.maxScore !== undefined;

  if (
    !hasCategory &&
    !hasName &&
    !hasDefaultScore &&
    !hasDisplayOrder &&
    !hasMinScore &&
    !hasMaxScore
  ) {
    throw new BadRequestException('수정할 항목이 없습니다.');
  }

  return {
    category: hasCategory
      ? parseRequiredTextInput(body.category, '카테고리를 입력해주세요.', 50)
      : undefined,
    name: hasName
      ? parseRequiredTextInput(body.name, '항목명을 입력해주세요.', 100)
      : undefined,
    defaultScore: hasDefaultScore
      ? parseRequiredPositiveIntInput(
          body.defaultScore,
          '기본점수',
          1,
          1000000000,
        )
      : undefined,
    displayOrder: hasDisplayOrder
      ? parseRequiredDisplayOrderInput(body.displayOrder)
      : undefined,
    minScore: hasMinScore
      ? parseOptionalScoreInput(body.minScore, '최소점수')
      : undefined,
    maxScore: hasMaxScore
      ? parseOptionalScoreInput(body.maxScore, '최대점수')
      : undefined,
  } satisfies UpdateRuleInput;
}

export function parseEntryId(value: unknown) {
  return parseRequiredPositiveIntInput(value, '상벌점 내역 ID', 1, 1000000000);
}

export function parseRuleId(value: unknown) {
  return parseRequiredPositiveIntInput(value, '상벌점 항목 ID', 1, 1000000000);
}

function parseOptionalSchool(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === School.GBSW || value === School.BYMS) {
    return value;
  }

  throw new BadRequestException('학교 정보가 올바르지 않습니다.');
}

function parseOptionalMileageType(value: unknown): MileageApiType | undefined {
  const text = parseOptionalTextInput(value);

  if (!text) {
    return undefined;
  }

  if (text === 'reward' || text === 'penalty') {
    return text;
  }

  throw new BadRequestException('상벌점 구분이 올바르지 않습니다.');
}

function parseRequiredMileageType(value: unknown): MileageApiType {
  const type = parseOptionalMileageType(value);

  if (!type) {
    throw new BadRequestException('상벌점 구분이 올바르지 않습니다.');
  }

  return type;
}

function parseOptionalScoreInput(
  value: unknown,
  label: string,
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return parseRequiredPositiveIntInput(value, label, 1, 1000000000);
}

export function validateScoreWithinRange(
  score: number,
  minScore?: number | null,
  maxScore?: number | null,
  label = '점수',
) {
  if (
    minScore !== undefined &&
    minScore !== null &&
    maxScore !== undefined &&
    maxScore !== null &&
    minScore > maxScore
  ) {
    throw new BadRequestException('최소점수는 최대점수보다 클 수 없습니다.');
  }

  if (minScore !== undefined && minScore !== null && score < minScore) {
    throw new BadRequestException(`${label}는 ${minScore} 이상이어야 합니다.`);
  }

  if (maxScore !== undefined && maxScore !== null && score > maxScore) {
    throw new BadRequestException(`${label}는 ${maxScore} 이하여야 합니다.`);
  }
}
