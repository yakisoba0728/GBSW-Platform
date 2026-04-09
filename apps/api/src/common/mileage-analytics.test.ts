import { describe, expect, it } from 'vitest';
import {
  buildMileageOverviewSummary,
  buildMileageSummaryFromTotals,
  buildStudentTotalsByStudentId,
} from './mileage-analytics';

describe('mileage-analytics helpers', () => {
  it('builds overview summaries with a derived total count by default', () => {
    expect(
      buildMileageOverviewSummary({
        rewardCount: 3,
        penaltyCount: 2,
        rewardSum: 9,
        penaltySum: 4,
        uniqueStudents: 2,
      }),
    ).toEqual({
      rewardCount: 3,
      penaltyCount: 2,
      rewardSum: 9,
      penaltySum: 4,
      uniqueStudents: 2,
      totalCount: 5,
    });
  });

  it('aggregates reward and penalty totals by student id', () => {
    expect(
      buildStudentTotalsByStudentId(
        [
          {
            studentId: 'GB240101',
            type: 'REWARD',
            count: 2,
            totalScore: 5,
          },
          {
            studentId: 'GB240101',
            type: 'PENALTY',
            count: 1,
            totalScore: 2,
          },
          {
            studentId: 'GB240102',
            type: 'REWARD',
            count: 1,
            totalScore: 3,
          },
        ],
        'REWARD',
      ),
    ).toEqual(
      new Map([
        ['GB240101', { rewardTotal: 5, penaltyTotal: 2, entryCount: 3 }],
        ['GB240102', { rewardTotal: 3, penaltyTotal: 0, entryCount: 1 }],
      ]),
    );
  });

  it('builds student summaries with zero totals when none are provided', () => {
    expect(
      buildMileageSummaryFromTotals({
        studentId: 'GB240101',
        name: '홍길동',
      }),
    ).toEqual({
      studentId: 'GB240101',
      name: '홍길동',
      rewardTotal: 0,
      penaltyTotal: 0,
      netScore: 0,
      entryCount: 0,
    });
  });
});
