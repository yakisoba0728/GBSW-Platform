import { describe, expect, it } from 'vitest';
import {
  buildClassMileageSummary,
  buildStudentMileageSummary,
  calculateStudentGrade,
  compareStudentIdentity,
} from './mileage-summary';

describe('mileage-summary helpers', () => {
  it('calculates a student grade from the account id prefix', () => {
    expect(calculateStudentGrade('GB240101', 2024)).toBe(1);
    expect(calculateStudentGrade('GB230101', 2024)).toBe(2);
    expect(calculateStudentGrade('invalid-id', 2024)).toBeNull();
  });

  it('sorts null grades after numbered grades', () => {
    expect(
      compareStudentIdentity(
        {
          grade: 1,
          classNumber: 1,
          studentNumber: 1,
          name: '첫째',
        },
        {
          grade: null,
          classNumber: 1,
          studentNumber: 1,
          name: '둘째',
        },
      ),
    ).toBeLessThan(0);
  });

  it('builds reward and penalty totals without changing student metadata', () => {
    const student = {
      studentId: 'GB240101',
      name: '홍길동',
      school: 'GBSW',
      grade: 1,
      classNumber: 1,
      studentNumber: 1,
    };

    expect(
      buildStudentMileageSummary(student, [
        { type: 'REWARD', score: 3 },
        { type: 'PENALTY', score: 1 },
        { type: 'REWARD', score: 2 },
      ]),
    ).toMatchObject({
      studentId: 'GB240101',
      school: 'GBSW',
      rewardTotal: 5,
      penaltyTotal: 1,
      netScore: 4,
      entryCount: 3,
    });
  });

  it('sorts students consistently inside class summaries and keeps the bottom slice', () => {
    const classSummary = buildClassMileageSummary(1, [
      {
        studentId: 'GB240102',
        name: '둘째',
        grade: 1,
        classNumber: 1,
        studentNumber: 2,
        rewardTotal: 4,
        penaltyTotal: 1,
        netScore: 3,
        entryCount: 2,
      },
      {
        studentId: 'GB240101',
        name: '첫째',
        grade: 1,
        classNumber: 1,
        studentNumber: 1,
        rewardTotal: 6,
        penaltyTotal: 0,
        netScore: 6,
        entryCount: 1,
      },
      {
        studentId: 'GB240103',
        name: '셋째',
        grade: 1,
        classNumber: 1,
        studentNumber: 3,
        rewardTotal: 0,
        penaltyTotal: 4,
        netScore: -4,
        entryCount: 1,
      },
      {
        studentId: 'GB240104',
        name: '넷째',
        grade: 1,
        classNumber: 1,
        studentNumber: 4,
        rewardTotal: 1,
        penaltyTotal: 5,
        netScore: -4,
        entryCount: 1,
      },
      {
        studentId: 'GB240105',
        name: '다섯째',
        grade: 1,
        classNumber: 1,
        studentNumber: 5,
        rewardTotal: 0,
        penaltyTotal: 0,
        netScore: 0,
        entryCount: 0,
      },
    ]);

    expect(
      classSummary.topStudents.map((student) => student.studentId),
    ).toEqual(['GB240101', 'GB240102', 'GB240103']);
    expect(
      compareStudentIdentity(
        classSummary.topStudents[0],
        classSummary.topStudents[1],
      ),
    ).toBeLessThan(0);
    expect(
      classSummary.bottomStudents.map((student) => student.studentId),
    ).toEqual(['GB240104', 'GB240103', 'GB240102']);
    expect(classSummary.studentCount).toBe(5);
  });
});
