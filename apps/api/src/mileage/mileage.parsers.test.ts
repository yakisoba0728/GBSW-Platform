import { describe, expect, it } from 'vitest';
import { MileageScope } from '@prisma/client';
import {
  parseCreateRuleInput,
  parseStudentFilters,
  validateScoreWithinRange,
} from './mileage.parsers';

describe('mileage.parsers', () => {
  it('accepts grade/year and name/studentName aliases consistently', () => {
    expect(
      parseStudentFilters(MileageScope.SCHOOL, {
        year: '2',
        class: '3',
        studentName: '홍길동',
        school: 'GBSW',
      }),
    ).toEqual({
      school: 'GBSW',
      grade: 2,
      classNumber: 3,
      name: '홍길동',
      studentId: undefined,
    });

    expect(
      parseStudentFilters(MileageScope.DORM, {
        grade: '1',
        classNumber: '4',
        name: '김철수',
      }),
    ).toEqual({
      school: undefined,
      grade: 1,
      classNumber: 4,
      name: '김철수',
      studentId: undefined,
    });
  });

  it('rejects invalid dorm rule score ranges before they reach the service', () => {
    expect(() =>
      parseCreateRuleInput(MileageScope.DORM, {
        type: 'reward',
        category: '생활',
        name: '정리정돈',
        defaultScore: '8',
        minScore: '10',
        maxScore: '20',
      }),
    ).toThrow('기본점수는 10 이상이어야 합니다.');

    expect(() =>
      parseCreateRuleInput(MileageScope.DORM, {
        type: 'reward',
        category: '생활',
        name: '정리정돈',
        defaultScore: '8',
        minScore: '20',
        maxScore: '10',
      }),
    ).toThrow('최소점수는 최대점수보다 클 수 없습니다.');
  });

  it('validates score bounds for export and write flows consistently', () => {
    expect(() => validateScoreWithinRange(5, 10, undefined)).toThrow(
      '점수는 10 이상이어야 합니다.',
    );
    expect(() => validateScoreWithinRange(15, undefined, 10)).toThrow(
      '점수는 10 이하여야 합니다.',
    );
  });
});
