import { Prisma } from '@prisma/client';

type MileageDateFilters = {
  startDate?: Date;
  endDate?: Date;
};

export type MileageOverviewSummary = {
  rewardCount: number;
  penaltyCount: number;
  rewardSum: number;
  penaltySum: number;
  uniqueStudents: number;
  totalCount: number;
};

export type MileageCategoryAggregateRow<TType extends string> = {
  category: string;
  type: TType;
  count: number;
  totalScore: number;
};

export type MileageTopRuleAggregateRow<TType extends string> = {
  ruleId: number;
  ruleName: string;
  category: string;
  type: TType;
  count: number;
  totalScore: number;
};

export type MileageStudentAggregateRow<TType extends string> = {
  studentId: string;
  type: TType;
  count: number;
  totalScore: number;
};

export type MileageStudentTotals = {
  rewardTotal: number;
  penaltyTotal: number;
  entryCount: number;
};

export const EMPTY_MILEAGE_TOTALS: MileageStudentTotals = {
  rewardTotal: 0,
  penaltyTotal: 0,
  entryCount: 0,
};

export function buildMileageEntryWhere(
  filters: MileageDateFilters,
  studentIds?: string[],
) {
  return {
    deletedAt: null,
    awardedAt:
      filters.startDate || filters.endDate
        ? {
            gte: filters.startDate ?? undefined,
            lte: filters.endDate ?? undefined,
          }
        : undefined,
    studentId: studentIds?.length
      ? {
          in: studentIds,
        }
      : undefined,
  };
}

export function buildMileageEntryWhereSql(
  filters: MileageDateFilters,
  studentIds?: string[],
) {
  const conditions: Prisma.Sql[] = [Prisma.sql`e.deleted_at IS NULL`];

  if (filters.startDate) {
    conditions.push(Prisma.sql`e.awarded_at >= ${filters.startDate}`);
  }

  if (filters.endDate) {
    conditions.push(Prisma.sql`e.awarded_at <= ${filters.endDate}`);
  }

  if (studentIds?.length) {
    conditions.push(Prisma.sql`e.student_id IN (${Prisma.join(studentIds)})`);
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
}

export function buildMileageOverviewSummary(
  row?: Partial<MileageOverviewSummary>,
): MileageOverviewSummary {
  const rewardCount = row?.rewardCount ?? 0;
  const penaltyCount = row?.penaltyCount ?? 0;

  return {
    rewardCount,
    penaltyCount,
    rewardSum: row?.rewardSum ?? 0,
    penaltySum: row?.penaltySum ?? 0,
    uniqueStudents: row?.uniqueStudents ?? 0,
    totalCount: row?.totalCount ?? rewardCount + penaltyCount,
  };
}

export function emptyMileageOverview<TCategoryStat, TTopRuleStat>() {
  return {
    summary: buildMileageOverviewSummary(),
    categoryStats: [] as TCategoryStat[],
    topRules: [] as TTopRuleStat[],
  };
}

export function emptyMileageClassAnalytics<TClassSummary>() {
  return {
    classes: [] as TClassSummary[],
    overall: {
      classCount: 0,
      totalStudents: 0,
      rewardTotal: 0,
      penaltyTotal: 0,
      netScore: 0,
    },
  };
}

export function buildMileageSummaryFromTotals<TStudent extends object>(
  student: TStudent,
  totals?: MileageStudentTotals,
) {
  const nextTotals = totals ?? EMPTY_MILEAGE_TOTALS;

  return {
    ...student,
    rewardTotal: nextTotals.rewardTotal,
    penaltyTotal: nextTotals.penaltyTotal,
    netScore: nextTotals.rewardTotal - nextTotals.penaltyTotal,
    entryCount: nextTotals.entryCount,
  };
}

export function buildStudentTotalsByStudentId<TType extends string>(
  rows: Array<MileageStudentAggregateRow<TType>>,
  rewardType: TType,
) {
  const totalsByStudentId = new Map<string, MileageStudentTotals>();

  for (const row of rows) {
    const nextTotals = totalsByStudentId.get(row.studentId) ?? {
      rewardTotal: 0,
      penaltyTotal: 0,
      entryCount: 0,
    };

    if (row.type === rewardType) {
      nextTotals.rewardTotal += row.totalScore;
    } else {
      nextTotals.penaltyTotal += row.totalScore;
    }

    nextTotals.entryCount += row.count;
    totalsByStudentId.set(row.studentId, nextTotals);
  }

  return totalsByStudentId;
}

export function mapMileageCategoryStat<
  TType extends string,
  TApiType extends string,
>(
  row: MileageCategoryAggregateRow<TType>,
  toApiType: (type: TType) => TApiType,
) {
  return {
    category: row.category,
    type: toApiType(row.type),
    count: row.count,
    totalScore: row.totalScore,
  };
}

export function mapMileageTopRuleStat<
  TType extends string,
  TApiType extends string,
>(
  row: MileageTopRuleAggregateRow<TType>,
  toApiType: (type: TType) => TApiType,
) {
  return {
    ruleId: row.ruleId,
    ruleName: row.ruleName,
    category: row.category,
    type: toApiType(row.type),
    count: row.count,
    totalScore: row.totalScore,
  };
}
