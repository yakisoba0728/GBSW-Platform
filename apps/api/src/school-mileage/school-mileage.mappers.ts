import { SchoolMileageType, type Prisma, type School } from '@prisma/client';
import type {
  ClassMileageSummary,
  HistoryEntryRecord,
  SchoolMileageApiType,
  StudentMileageSummary,
  StudentSummary,
} from './school-mileage.types';

export function toApiMileageType(
  type: SchoolMileageType,
): SchoolMileageApiType {
  return type === 'REWARD' ? 'reward' : 'penalty';
}

export function toPrismaMileageType(type: SchoolMileageApiType) {
  return type === 'reward'
    ? SchoolMileageType.REWARD
    : SchoolMileageType.PENALTY;
}

export function calculateStudentGrade(studentId: string, currentYear: number) {
  const match = /^[A-Za-z]{2}(\d{2})/.exec(studentId);

  if (!match) {
    return null;
  }

  const admissionYearSuffix = Number.parseInt(match[1], 10);

  if (Number.isNaN(admissionYearSuffix)) {
    return null;
  }

  const currentCentury = Math.floor(currentYear / 100) * 100;
  let admissionYear = currentCentury + admissionYearSuffix;

  if (admissionYear > currentYear) {
    admissionYear -= 100;
  }

  const grade = currentYear - admissionYear + 1;

  if (grade < 1 || grade > 3) {
    return null;
  }

  return grade;
}

export function mapStudentSummary(student: {
  studentId: string;
  name: string;
  school: School;
  currentYear: number;
  currentClass: number;
  currentNumber: number;
}): StudentSummary {
  return {
    studentId: student.studentId,
    name: student.name,
    school: student.school,
    grade: calculateStudentGrade(student.studentId, student.currentYear),
    classNumber: student.currentClass,
    studentNumber: student.currentNumber,
  };
}

export function compareStudentSummary(
  left: StudentSummary,
  right: StudentSummary,
) {
  return (
    compareNullableNumber(left.grade, right.grade) ||
    left.classNumber - right.classNumber ||
    left.studentNumber - right.studentNumber ||
    left.name.localeCompare(right.name, 'ko')
  );
}

export function compareStudentMileageSummary(
  left: StudentMileageSummary,
  right: StudentMileageSummary,
) {
  return compareStudentSummary(left, right);
}

export function mapHistoryEntry(entry: HistoryEntryRecord) {
  const studentGrade = calculateStudentGrade(
    entry.student.studentId,
    entry.student.currentYear,
  );

  return {
    id: entry.id,
    type: toApiMileageType(entry.type),
    score: entry.score,
    reason: entry.reason,
    awardedAt: entry.awardedAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    ruleId: entry.rule.id,
    ruleCategory: entry.rule.category,
    ruleName: entry.rule.name,
    ruleDefaultScore: entry.rule.defaultScore,
    studentId: entry.student.studentId,
    studentName: entry.student.name,
    school: entry.student.school,
    grade: studentGrade,
    classNumber: entry.student.currentClass,
    studentNumber: entry.student.currentNumber,
    teacherId: entry.createdByTeacher.teacherId,
    teacherName: entry.createdByTeacher.name,
  };
}

export function mapStudentHistoryEntry(entry: HistoryEntryRecord) {
  const studentGrade = calculateStudentGrade(
    entry.student.studentId,
    entry.student.currentYear,
  );

  return {
    id: entry.id,
    type: toApiMileageType(entry.type),
    score: entry.score,
    reason: entry.reason,
    awardedAt: entry.awardedAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    ruleId: entry.rule.id,
    ruleCategory: entry.rule.category,
    ruleName: entry.rule.name,
    ruleDefaultScore: entry.rule.defaultScore,
    studentId: entry.student.studentId,
    studentName: entry.student.name,
    school: entry.student.school,
    grade: studentGrade,
    classNumber: entry.student.currentClass,
    studentNumber: entry.student.currentNumber,
    teacherName: entry.createdByTeacher.name,
  };
}

export function buildStudentMileageSummary(
  student: StudentSummary,
  entries: Array<{ type: SchoolMileageType; score: number }>,
): StudentMileageSummary {
  let rewardTotal = 0;
  let penaltyTotal = 0;

  for (const entry of entries) {
    if (entry.type === 'REWARD') {
      rewardTotal += entry.score;
    } else {
      penaltyTotal += entry.score;
    }
  }

  return {
    ...student,
    rewardTotal,
    penaltyTotal,
    netScore: rewardTotal - penaltyTotal,
    entryCount: entries.length,
  };
}

export function buildClassMileageSummary(
  classNumber: number,
  studentSummaries: StudentMileageSummary[],
): ClassMileageSummary {
  const rewardTotal = studentSummaries.reduce(
    (acc, student) => acc + student.rewardTotal,
    0,
  );
  const penaltyTotal = studentSummaries.reduce(
    (acc, student) => acc + student.penaltyTotal,
    0,
  );
  const netScore = rewardTotal - penaltyTotal;
  const avgNetScore =
    studentSummaries.length > 0
      ? Math.round((netScore / studentSummaries.length) * 10) / 10
      : 0;
  const rankedStudents = studentSummaries.filter(
    (student) => student.entryCount > 0,
  );
  const sortedByNetScore = [...rankedStudents].sort(
    (left, right) =>
      right.netScore - left.netScore ||
      compareStudentMileageSummary(left, right),
  );

  return {
    classNumber,
    studentCount: studentSummaries.length,
    rewardTotal,
    penaltyTotal,
    netScore,
    avgNetScore,
    topStudents: sortedByNetScore.slice(0, 3),
    bottomStudents:
      sortedByNetScore.length > 3 ? sortedByNetScore.slice(-3).reverse() : [],
  };
}

export const schoolMileageEntrySelect = {
  id: true,
  type: true,
  score: true,
  reason: true,
  awardedAt: true,
  createdAt: true,
  updatedAt: true,
  rule: {
    select: {
      id: true,
      category: true,
      name: true,
      defaultScore: true,
    },
  },
  student: {
    select: {
      studentId: true,
      name: true,
      school: true,
      currentYear: true,
      currentClass: true,
      currentNumber: true,
    },
  },
  createdByTeacher: {
    select: {
      teacherId: true,
      name: true,
    },
  },
} satisfies Prisma.SchoolMileageEntrySelect;

function compareNullableNumber(left: number | null, right: number | null) {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}
