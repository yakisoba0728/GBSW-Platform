import { DormMileageType } from '@prisma/client';

export type DormMileageApiType = 'reward' | 'penalty';

export type StudentSummary = {
  studentId: string;
  name: string;
  grade: number | null;
  classNumber: number;
  studentNumber: number;
};

export type StudentMileageSummary = StudentSummary & {
  rewardTotal: number;
  penaltyTotal: number;
  netScore: number;
  entryCount: number;
};

export type ClassMileageSummary = {
  classNumber: number;
  studentCount: number;
  rewardTotal: number;
  penaltyTotal: number;
  netScore: number;
  avgNetScore: number;
  topStudents: StudentMileageSummary[];
  bottomStudents: StudentMileageSummary[];
};

export type CategoryStat = {
  category: string;
  type: DormMileageApiType;
  count: number;
  totalScore: number;
};

export type TopRuleStat = {
  ruleId: number;
  ruleName: string;
  category: string;
  type: DormMileageApiType;
  count: number;
  totalScore: number;
};

export type OverviewSummary = {
  rewardCount: number;
  penaltyCount: number;
  rewardSum: number;
  penaltySum: number;
  uniqueStudents: number;
  totalCount: number;
};

export type StudentFilterOptions = {
  grade?: number;
  classNumber?: number;
  name?: string;
  studentId?: string;
};

export type EntryFilterOptions = StudentFilterOptions & {
  type?: DormMileageApiType;
  studentName?: string;
  startDate?: Date;
  endDate?: Date;
};

export type PaginatedEntryFilterOptions = EntryFilterOptions & {
  page: number;
  pageSize: number;
};

export type CreateEntryInput = {
  studentId: string;
  ruleId: number;
  score: number;
  reason: string | null;
};

export type UpdateEntryInput = {
  ruleId?: number;
  score?: number;
  reasonProvided: boolean;
  reason?: string | null;
  awardedAt?: Date;
};

export type DormMileageRuleSummary = {
  id: number;
  type: DormMileageApiType;
  category: string;
  name: string;
  defaultScore: number;
  displayOrder: number;
  isActive: boolean;
  minScore: number | null;
  maxScore: number | null;
};

export type CreateRuleInput = {
  type: DormMileageApiType;
  category: string;
  name: string;
  defaultScore: number;
  displayOrder?: number;
  minScore?: number | null;
  maxScore?: number | null;
};

export type UpdateRuleInput = {
  category?: string;
  name?: string;
  defaultScore?: number;
  displayOrder?: number;
  minScore?: number | null;
  maxScore?: number | null;
};

export type HistoryEntryRecord = {
  id: number;
  type: DormMileageType;
  score: number;
  reason: string | null;
  awardedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  rule: {
    id: number;
    category: string;
    name: string;
    defaultScore: number;
    minScore: number | null;
    maxScore: number | null;
  };
  student: {
    studentId: string;
    name: string;
    currentYear: number;
    currentClass: number;
    currentNumber: number;
  };
  createdByTeacher: {
    teacherId: string;
    name: string;
  };
};
