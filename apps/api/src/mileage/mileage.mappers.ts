import {
  MileageScope,
  MileageType,
  type Prisma,
  type School,
} from '@prisma/client';
import {
  buildClassMileageSummary as buildSharedClassMileageSummary,
  buildStudentMileageSummary as buildSharedStudentMileageSummary,
  calculateStudentGrade as calculateSharedStudentGrade,
  compareStudentIdentity,
  compareStudentMileageSummary as compareSharedStudentMileageSummary,
} from '../common/mileage-summary';
import type {
  ClassMileageSummary,
  HistoryEntryRecord,
  MileageApiType,
  MileageRuleSummary,
  StudentMileageSummary,
  StudentSummary,
} from './mileage.types';

export function toApiMileageType(type: MileageType): MileageApiType {
  return type === 'REWARD' ? 'reward' : 'penalty';
}

export function toPrismaMileageType(type: MileageApiType) {
  return type === 'reward' ? MileageType.REWARD : MileageType.PENALTY;
}

export function calculateStudentGrade(studentId: string, currentYear: number) {
  return calculateSharedStudentGrade(studentId, currentYear);
}

export function mapStudentSummary(student: {
  studentId: string;
  name: string | null;
  school: School;
  currentYear: number;
  currentClass: number;
  currentNumber: number;
}): StudentSummary {
  return {
    studentId: student.studentId,
    name: student.name ?? '',
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
  return compareStudentIdentity(left, right);
}

export function compareStudentMileageSummary(
  left: StudentMileageSummary,
  right: StudentMileageSummary,
) {
  return compareSharedStudentMileageSummary(left, right);
}

export function mapHistoryEntry(
  scope: MileageScope,
  entry: HistoryEntryRecord,
) {
  const studentGrade = calculateStudentGrade(
    entry.student.studentId,
    entry.student.currentYear,
  );

  const base = {
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
    grade: studentGrade,
    classNumber: entry.student.currentClass,
    studentNumber: entry.student.currentNumber,
    teacherId: entry.createdByTeacher.teacherId,
    teacherName: entry.createdByTeacher.name,
  };

  if (scope === MileageScope.SCHOOL) {
    return {
      ...base,
      school: entry.student.school,
    };
  }

  return {
    ...base,
    ruleMinScore: entry.rule.minScore,
    ruleMaxScore: entry.rule.maxScore,
  };
}

export function mapStudentHistoryEntry(
  scope: MileageScope,
  entry: HistoryEntryRecord,
) {
  const studentGrade = calculateStudentGrade(
    entry.student.studentId,
    entry.student.currentYear,
  );

  const base = {
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
    grade: studentGrade,
    classNumber: entry.student.currentClass,
    studentNumber: entry.student.currentNumber,
    teacherName: entry.createdByTeacher.name,
  };

  if (scope === MileageScope.SCHOOL) {
    return {
      ...base,
      school: entry.student.school,
    };
  }

  return {
    ...base,
    ruleMinScore: entry.rule.minScore,
    ruleMaxScore: entry.rule.maxScore,
  };
}

export function buildStudentMileageSummary(
  student: StudentSummary,
  entries: Array<{ type: MileageType; score: number }>,
): StudentMileageSummary {
  return buildSharedStudentMileageSummary(student, entries);
}

export function buildClassMileageSummary(
  classNumber: number,
  studentSummaries: StudentMileageSummary[],
): ClassMileageSummary {
  return buildSharedClassMileageSummary(classNumber, studentSummaries);
}

export function mapRuleSummary(rule: {
  id: number;
  type: MileageType;
  category: string;
  name: string;
  defaultScore: number;
  displayOrder: number;
  isActive: boolean;
  minScore: number | null;
  maxScore: number | null;
}): MileageRuleSummary {
  return {
    id: rule.id,
    type: toApiMileageType(rule.type),
    category: rule.category,
    name: rule.name,
    defaultScore: rule.defaultScore,
    displayOrder: rule.displayOrder,
    isActive: rule.isActive,
    minScore: rule.minScore,
    maxScore: rule.maxScore,
  };
}

export const mileageRuleSummarySelect = {
  id: true,
  type: true,
  category: true,
  name: true,
  defaultScore: true,
  displayOrder: true,
  isActive: true,
  minScore: true,
  maxScore: true,
} as const;

export const mileageEntrySelect = {
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
      minScore: true,
      maxScore: true,
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
} satisfies Prisma.MileageEntrySelect;
