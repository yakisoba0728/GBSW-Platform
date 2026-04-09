import { SchoolMileageType, type Prisma, type School } from '@prisma/client';
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
  return calculateSharedStudentGrade(studentId, currentYear);
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
  return compareStudentIdentity(left, right);
}

export function compareStudentMileageSummary(
  left: StudentMileageSummary,
  right: StudentMileageSummary,
) {
  return compareSharedStudentMileageSummary(left, right);
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
  return buildSharedStudentMileageSummary(student, entries);
}

export function buildClassMileageSummary(
  classNumber: number,
  studentSummaries: StudentMileageSummary[],
): ClassMileageSummary {
  return buildSharedClassMileageSummary(classNumber, studentSummaries);
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
