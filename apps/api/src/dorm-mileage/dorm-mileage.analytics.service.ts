import { Injectable } from '@nestjs/common';
import { DormMileageType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertTeacherExists } from './dorm-mileage.access';
import {
  buildClassMileageSummary,
  compareStudentMileageSummary,
} from './dorm-mileage.mappers';
import { parseAnalyticsFilters } from './dorm-mileage.parsers';
import { findDormStudentsByFilters } from './dorm-mileage.students.data';
import type {
  ClassMileageSummary,
  DormMileageApiType,
  StudentMileageSummary,
  StudentSummary,
} from './dorm-mileage.types';

type OverviewAggregateRow = {
  rewardCount: number;
  penaltyCount: number;
  rewardSum: number;
  penaltySum: number;
  uniqueStudents: number;
  totalCount: number;
};

type CategoryAggregateRow = {
  category: string;
  type: DormMileageType;
  count: number;
  totalScore: number;
};

type TopRuleAggregateRow = {
  ruleId: number;
  ruleName: string;
  category: string;
  type: DormMileageType;
  count: number;
  totalScore: number;
};

type StudentAggregateRow = {
  studentId: string;
  type: DormMileageType;
  count: number;
  totalScore: number;
};

type StudentTotals = {
  rewardTotal: number;
  penaltyTotal: number;
  entryCount: number;
};

const EMPTY_TOTALS: StudentTotals = {
  rewardTotal: 0,
  penaltyTotal: 0,
  entryCount: 0,
};

@Injectable()
export class DormMileageAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(query);
    const studentIds = await this.resolveStudentIds(filters);

    if (studentIds && studentIds.length === 0) {
      return emptyOverview();
    }

    const whereSql = buildEntryWhereSql(filters, studentIds);
    const [summary] = await this.prisma.$queryRaw<
      OverviewAggregateRow[]
    >(Prisma.sql`
      SELECT
        COALESCE(SUM(CASE WHEN e.type = 'REWARD' THEN 1 ELSE 0 END), 0)::int AS "rewardCount",
        COALESCE(SUM(CASE WHEN e.type = 'PENALTY' THEN 1 ELSE 0 END), 0)::int AS "penaltyCount",
        COALESCE(SUM(CASE WHEN e.type = 'REWARD' THEN e.score ELSE 0 END), 0)::int AS "rewardSum",
        COALESCE(SUM(CASE WHEN e.type = 'PENALTY' THEN e.score ELSE 0 END), 0)::int AS "penaltySum",
        COALESCE(COUNT(DISTINCT e.student_id), 0)::int AS "uniqueStudents",
        COALESCE(COUNT(*), 0)::int AS "totalCount"
      FROM dorm_mileage_entries e
      ${whereSql}
    `);

    const categoryStats = await this.prisma.$queryRaw<
      CategoryAggregateRow[]
    >(Prisma.sql`
      SELECT
        r.category AS "category",
        e.type AS "type",
        COUNT(*)::int AS "count",
        COALESCE(SUM(e.score), 0)::int AS "totalScore"
      FROM dorm_mileage_entries e
      JOIN dorm_mileage_rules r ON r.id = e.rule_id
      ${whereSql}
      GROUP BY r.category, e.type
      ORDER BY COUNT(*) DESC, COALESCE(SUM(e.score), 0) DESC
    `);

    const topRules = await this.prisma.$queryRaw<
      TopRuleAggregateRow[]
    >(Prisma.sql`
      SELECT
        r.id AS "ruleId",
        r.name AS "ruleName",
        r.category AS "category",
        e.type AS "type",
        COUNT(*)::int AS "count",
        COALESCE(SUM(e.score), 0)::int AS "totalScore"
      FROM dorm_mileage_entries e
      JOIN dorm_mileage_rules r ON r.id = e.rule_id
      ${whereSql}
      GROUP BY r.id, r.name, r.category, e.type
      ORDER BY COUNT(*) DESC, COALESCE(SUM(e.score), 0) DESC
      LIMIT 5
    `);

    return {
      summary: summary ?? emptyOverview().summary,
      categoryStats: categoryStats.map(mapCategoryStat),
      topRules: topRules.map(mapTopRuleStat),
    };
  }

  async getStudentAnalytics(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(query);
    const students = await findDormStudentsByFilters(this.prisma, {
      grade: filters.grade,
      classNumber: filters.classNumber,
      name: filters.name,
      studentId: filters.studentId,
    });

    if (students.length === 0) {
      return { students: [], totalCount: 0 };
    }

    const aggregateRows = await this.fetchStudentAggregates(
      filters,
      students.map((student) => student.studentId),
    );
    const totalsByStudentId = buildTotalsByStudentId(aggregateRows);
    const summaries = students
      .filter((student) => totalsByStudentId.has(student.studentId))
      .map((student) =>
        buildStudentMileageSummaryFromTotals(
          student,
          totalsByStudentId.get(student.studentId) ?? EMPTY_TOTALS,
        ),
      )
      .sort(compareStudentMileageSummary);

    return {
      students: summaries,
      totalCount: summaries.length,
    };
  }

  async getClassAnalytics(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(query);
    const students = await findDormStudentsByFilters(this.prisma, {
      grade: filters.grade,
      classNumber: filters.classNumber,
      name: filters.name,
      studentId: filters.studentId,
    });

    if (students.length === 0) {
      return emptyClassAnalytics();
    }

    const aggregateRows = await this.fetchStudentAggregates(
      filters,
      students.map((student) => student.studentId),
    );
    const totalsByStudentId = buildTotalsByStudentId(aggregateRows);
    const classMap = new Map<number, StudentMileageSummary[]>();

    for (const student of students) {
      const summary = buildStudentMileageSummaryFromTotals(
        student,
        totalsByStudentId.get(student.studentId) ?? EMPTY_TOTALS,
      );
      const nextSummaries = classMap.get(summary.classNumber) ?? [];

      nextSummaries.push(summary);
      classMap.set(summary.classNumber, nextSummaries);
    }

    const classes = [...classMap.entries()]
      .map(([classNumber, classStudents]) =>
        buildClassMileageSummary(classNumber, classStudents),
      )
      .sort((left, right) => left.classNumber - right.classNumber);

    const rewardTotal = classes.reduce(
      (acc, classSummary) => acc + classSummary.rewardTotal,
      0,
    );
    const penaltyTotal = classes.reduce(
      (acc, classSummary) => acc + classSummary.penaltyTotal,
      0,
    );
    const totalStudents = classes.reduce(
      (acc, classSummary) => acc + classSummary.studentCount,
      0,
    );

    return {
      classes,
      overall: {
        classCount: classes.length,
        totalStudents,
        rewardTotal,
        penaltyTotal,
        netScore: rewardTotal - penaltyTotal,
      },
    };
  }

  private async resolveStudentIds(
    filters: ReturnType<typeof parseAnalyticsFilters>,
  ) {
    if (
      !filters.grade &&
      !filters.classNumber &&
      !filters.name &&
      !filters.studentName &&
      !filters.studentId
    ) {
      return undefined;
    }

    const students = await findDormStudentsByFilters(this.prisma, {
      grade: filters.grade,
      classNumber: filters.classNumber,
      name: filters.name ?? filters.studentName,
      studentId: filters.studentId,
    });

    return students.map((student) => student.studentId);
  }

  private async fetchStudentAggregates(
    filters: ReturnType<typeof parseAnalyticsFilters>,
    studentIds: string[],
  ) {
    return this.prisma.$queryRaw<StudentAggregateRow[]>(Prisma.sql`
      SELECT
        e.student_id AS "studentId",
        e.type AS "type",
        COUNT(*)::int AS "count",
        COALESCE(SUM(e.score), 0)::int AS "totalScore"
      FROM dorm_mileage_entries e
      ${buildEntryWhereSql(filters, studentIds)}
      GROUP BY e.student_id, e.type
    `);
  }
}

function buildEntryWhereSql(
  filters: ReturnType<typeof parseAnalyticsFilters>,
  studentIds?: string[],
) {
  const conditions = [Prisma.sql`e.deleted_at IS NULL`];

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

function buildStudentMileageSummaryFromTotals(
  student: StudentSummary,
  totals: StudentTotals,
): StudentMileageSummary {
  return {
    ...student,
    rewardTotal: totals.rewardTotal,
    penaltyTotal: totals.penaltyTotal,
    netScore: totals.rewardTotal - totals.penaltyTotal,
    entryCount: totals.entryCount,
  };
}

function buildTotalsByStudentId(rows: StudentAggregateRow[]) {
  const totalsByStudentId = new Map<string, StudentTotals>();

  for (const row of rows) {
    const nextTotals = totalsByStudentId.get(row.studentId) ?? {
      rewardTotal: 0,
      penaltyTotal: 0,
      entryCount: 0,
    };

    if (row.type === 'REWARD') {
      nextTotals.rewardTotal += row.totalScore;
    } else {
      nextTotals.penaltyTotal += row.totalScore;
    }

    nextTotals.entryCount += row.count;
    totalsByStudentId.set(row.studentId, nextTotals);
  }

  return totalsByStudentId;
}

function mapCategoryStat(row: CategoryAggregateRow) {
  return {
    category: row.category,
    type: toApiDormMileageType(row.type),
    count: row.count,
    totalScore: row.totalScore,
  };
}

function mapTopRuleStat(row: TopRuleAggregateRow) {
  return {
    ruleId: row.ruleId,
    ruleName: row.ruleName,
    category: row.category,
    type: toApiDormMileageType(row.type),
    count: row.count,
    totalScore: row.totalScore,
  };
}

function emptyOverview() {
  return {
    summary: {
      rewardCount: 0,
      penaltyCount: 0,
      rewardSum: 0,
      penaltySum: 0,
      uniqueStudents: 0,
      totalCount: 0,
    },
    categoryStats: [],
    topRules: [],
  };
}

function emptyClassAnalytics() {
  return {
    classes: [] as ClassMileageSummary[],
    overall: {
      classCount: 0,
      totalStudents: 0,
      rewardTotal: 0,
      penaltyTotal: 0,
      netScore: 0,
    },
  };
}

function toApiDormMileageType(type: DormMileageType): DormMileageApiType {
  return type === 'REWARD' ? 'reward' : 'penalty';
}
