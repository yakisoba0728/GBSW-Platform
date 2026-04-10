import { Injectable } from '@nestjs/common';
import { MileageScope, MileageType, Prisma } from '@prisma/client';
import {
  buildMileageEntryWhere,
  buildMileageOverviewSummary,
  buildMileageSummaryFromTotals,
  buildStudentTotalsByStudentId,
  emptyMileageClassAnalytics,
  emptyMileageOverview,
  mapMileageCategoryStat,
  mapMileageTopRuleStat,
  type MileageCategoryAggregateRow,
  type MileageOverviewSummary,
  type MileageStudentAggregateRow,
  type MileageStudentTotals,
  type MileageTopRuleAggregateRow,
} from '../common/mileage-analytics';
import { assertTeacherExists } from '../common/auth-access';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildClassMileageSummary,
  compareStudentMileageSummary,
  toApiMileageType,
} from './mileage.mappers';
import { parseAnalyticsFilters } from './mileage.parsers';
import { findStudentsByFilters } from './mileage.students.data';
import type { StudentMileageSummary } from './mileage.types';

type OverviewAggregateRow = MileageOverviewSummary;
type CategoryAggregateRow = MileageCategoryAggregateRow<MileageType>;
type TopRuleAggregateRow = MileageTopRuleAggregateRow<MileageType>;
type StudentAggregateRow = MileageStudentAggregateRow<MileageType>;

@Injectable()
export class MileageAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(scope, query);
    const studentIds = await this.resolveStudentIds(scope, filters);

    if (studentIds && studentIds.length === 0) {
      return emptyMileageOverview();
    }

    const whereSql = buildMileageEntryWhereSqlWithScope(
      scope,
      filters,
      studentIds,
    );

    const [summaryRows, categoryStats, topRules] = await Promise.all([
      this.prisma.$queryRaw<OverviewAggregateRow[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(CASE WHEN e.type = 'REWARD' THEN 1 ELSE 0 END), 0)::int AS "rewardCount",
          COALESCE(SUM(CASE WHEN e.type = 'PENALTY' THEN 1 ELSE 0 END), 0)::int AS "penaltyCount",
          COALESCE(SUM(CASE WHEN e.type = 'REWARD' THEN e.score ELSE 0 END), 0)::int AS "rewardSum",
          COALESCE(SUM(CASE WHEN e.type = 'PENALTY' THEN e.score ELSE 0 END), 0)::int AS "penaltySum",
          COALESCE(COUNT(DISTINCT e.student_id), 0)::int AS "uniqueStudents"
        FROM mileage_entries e
        ${whereSql}
      `),
      this.prisma.$queryRaw<CategoryAggregateRow[]>(Prisma.sql`
        SELECT
          r.category AS "category",
          e.type AS "type",
          COUNT(*)::int AS "count",
          COALESCE(SUM(e.score), 0)::int AS "totalScore"
        FROM mileage_entries e
        JOIN mileage_rules r ON r.id = e.rule_id
        ${whereSql}
        GROUP BY r.category, e.type
        ORDER BY COUNT(*) DESC, COALESCE(SUM(e.score), 0) DESC
      `),
      this.prisma.$queryRaw<TopRuleAggregateRow[]>(Prisma.sql`
        SELECT
          r.id AS "ruleId",
          r.name AS "ruleName",
          r.category AS "category",
          e.type AS "type",
          COUNT(*)::int AS "count",
          COALESCE(SUM(e.score), 0)::int AS "totalScore"
        FROM mileage_entries e
        JOIN mileage_rules r ON r.id = e.rule_id
        ${whereSql}
        GROUP BY r.id, r.name, r.category, e.type
        ORDER BY COUNT(*) DESC, COALESCE(SUM(e.score), 0) DESC
        LIMIT 5
      `),
    ]);

    const row = summaryRows[0];

    return {
      summary: buildMileageOverviewSummary(row),
      categoryStats: categoryStats.map((row) =>
        mapMileageCategoryStat(row, toApiMileageType),
      ),
      topRules: topRules.map((row) =>
        mapMileageTopRuleStat(row, toApiMileageType),
      ),
    };
  }

  async getStudentAnalytics(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(scope, query);
    const students = await findStudentsByFilters(this.prisma, scope, {
      school: filters.school,
      grade: filters.grade,
      classNumber: filters.classNumber,
      name: filters.name,
      studentId: filters.studentId,
    });

    if (students.length === 0) {
      return { students: [], totalCount: 0 };
    }

    const aggregateRows = await this.getEntryTotalsByStudentId(
      scope,
      filters,
      students.map((student) => student.studentId),
    );
    const totalsByStudentId = buildStudentTotalsByStudentId(
      aggregateRows,
      MileageType.REWARD,
    );

    const summaries = students
      .map((student) =>
        toStudentMileageSummary(
          student,
          totalsByStudentId.get(student.studentId),
        ),
      )
      .filter((summary): summary is StudentMileageSummary => summary !== null)
      .sort(compareStudentMileageSummary);

    return {
      students: summaries,
      totalCount: summaries.length,
    };
  }

  async getClassAnalytics(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(scope, query);
    const students = await findStudentsByFilters(this.prisma, scope, {
      school: filters.school,
      grade: filters.grade,
      classNumber: filters.classNumber,
      name: filters.name,
      studentId: filters.studentId,
    });

    if (students.length === 0) {
      return emptyMileageClassAnalytics();
    }

    const aggregateRows = await this.getEntryTotalsByStudentId(
      scope,
      filters,
      students.map((student) => student.studentId),
    );
    const totalsByStudentId = buildStudentTotalsByStudentId(
      aggregateRows,
      MileageType.REWARD,
    );

    const studentsByClassNumber = new Map<number, StudentMileageSummary[]>();

    for (const student of students) {
      const nextStudents = studentsByClassNumber.get(student.classNumber) ?? [];
      nextStudents.push(
        toStudentMileageSummary(
          student,
          totalsByStudentId.get(student.studentId),
        ),
      );
      studentsByClassNumber.set(student.classNumber, nextStudents);
    }

    const classes = [...studentsByClassNumber.entries()]
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

  async getAnalyticsExport(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(scope, query);
    const students = await findStudentsByFilters(this.prisma, scope, {
      school: filters.school,
      grade: filters.grade,
      classNumber: filters.classNumber,
      name: filters.name,
      studentId: filters.studentId,
    });

    const overview = await this.getOverview(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );

    const aggregateRows = await this.getEntryTotalsByStudentId(
      scope,
      filters,
      students.map((student) => student.studentId),
    );
    const totalsByStudentId = buildStudentTotalsByStudentId(
      aggregateRows,
      MileageType.REWARD,
    );

    const summaries = students
      .map((student) => {
        const totals = totalsByStudentId.get(student.studentId) ?? {
          rewardTotal: 0,
          penaltyTotal: 0,
          entryCount: 0,
        };
        return toStudentMileageSummary(student, totals);
      })
      .filter((summary): summary is StudentMileageSummary => summary !== null)
      .sort(compareStudentMileageSummary);

    return {
      students: summaries,
      overview,
    };
  }

  private async getEntryTotalsByStudentId(
    scope: MileageScope,
    filters: ReturnType<typeof parseAnalyticsFilters>,
    studentIds: string[],
  ) {
    if (studentIds.length === 0) {
      return [] as StudentAggregateRow[];
    }

    const groupedEntries = await this.prisma.mileageEntry.groupBy({
      where: {
        ...buildMileageEntryWhere(scope, filters, studentIds),
      },
      by: ['studentId', 'type'],
      _count: {
        _all: true,
      },
      _sum: {
        score: true,
      },
    });

    return groupedEntries.map((row) => ({
      studentId: row.studentId,
      type: row.type,
      count: row._count._all,
      totalScore: row._sum.score ?? 0,
    }));
  }

  private async resolveStudentIds(
    scope: MileageScope,
    filters: ReturnType<typeof parseAnalyticsFilters>,
  ) {
    if (scope === MileageScope.SCHOOL) {
      if (
        !filters.school &&
        !filters.grade &&
        !filters.classNumber &&
        !filters.name &&
        !filters.studentName &&
        !filters.studentId
      ) {
        return undefined;
      }
    } else {
      if (
        !filters.grade &&
        !filters.classNumber &&
        !filters.name &&
        !filters.studentName &&
        !filters.studentId
      ) {
        return undefined;
      }
    }

    const students = await findStudentsByFilters(this.prisma, scope, {
      school: filters.school,
      grade: filters.grade,
      classNumber: filters.classNumber,
      name: filters.name ?? filters.studentName,
      studentId: filters.studentId,
    });

    return students.map((student) => student.studentId);
  }
}

function buildMileageEntryWhereSqlWithScope(
  scope: MileageScope,
  filters: { startDate?: Date; endDate?: Date },
  studentIds?: string[],
) {
  const scopeValue = scope === MileageScope.SCHOOL ? 'SCHOOL' : 'DORM';
  const conditions: Prisma.Sql[] = [
    Prisma.sql`e.deleted_at IS NULL`,
    Prisma.sql`e.scope = ${scopeValue}::"MileageScope"`,
  ];

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

function toStudentMileageSummary(
  student: {
    studentId: string;
    name: string;
    school: 'GBSW' | 'BYMS';
    grade: number | null;
    classNumber: number;
    studentNumber: number;
  },
  totals: MileageStudentTotals | undefined,
): StudentMileageSummary {
  return buildMileageSummaryFromTotals(student, totals);
}
