import { Injectable } from '@nestjs/common';
import { Prisma, SchoolMileageType } from '@prisma/client';
import {
  buildMileageEntryWhere,
  buildMileageEntryWhereSql,
  buildMileageOverviewSummary,
  buildMileageSummaryFromTotals,
  buildStudentTotalsByStudentId,
  emptyMileageClassAnalytics,
  emptyMileageOverview,
  mapMileageCategoryStat,
  mapMileageTopRuleStat,
  type MileageCategoryAggregateRow,
  type MileageOverviewSummary,
  type MileageStudentTotals,
  type MileageStudentAggregateRow,
  type MileageTopRuleAggregateRow,
} from '../common/mileage-analytics';
import { PrismaService } from '../prisma/prisma.service';
import { assertTeacherExists } from './school-mileage.access';
import {
  buildClassMileageSummary,
  compareStudentMileageSummary,
  toApiMileageType,
} from './school-mileage.mappers';
import { parseAnalyticsFilters } from './school-mileage.parsers';
import { findStudentsByFilters } from './school-mileage.students.data';
import type { StudentMileageSummary } from './school-mileage.types';

type OverviewAggregateRow = MileageOverviewSummary;
type CategoryAggregateRow = MileageCategoryAggregateRow<SchoolMileageType>;
type TopRuleAggregateRow = MileageTopRuleAggregateRow<SchoolMileageType>;
type StudentAggregateRow = MileageStudentAggregateRow<SchoolMileageType>;

@Injectable()
export class SchoolMileageAnalyticsService {
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
      return emptyMileageOverview();
    }

    const whereSql = buildMileageEntryWhereSql(filters, studentIds);

    const [summaryRows, categoryStats, topRules] = await Promise.all([
      this.prisma.$queryRaw<OverviewAggregateRow[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(CASE WHEN e.type = 'REWARD' THEN 1 ELSE 0 END), 0)::int AS "rewardCount",
          COALESCE(SUM(CASE WHEN e.type = 'PENALTY' THEN 1 ELSE 0 END), 0)::int AS "penaltyCount",
          COALESCE(SUM(CASE WHEN e.type = 'REWARD' THEN e.score ELSE 0 END), 0)::int AS "rewardSum",
          COALESCE(SUM(CASE WHEN e.type = 'PENALTY' THEN e.score ELSE 0 END), 0)::int AS "penaltySum",
          COALESCE(COUNT(DISTINCT e.student_id), 0)::int AS "uniqueStudents"
        FROM school_mileage_entries e
        ${whereSql}
      `),
      this.prisma.$queryRaw<CategoryAggregateRow[]>(Prisma.sql`
        SELECT
          r.category AS "category",
          e.type AS "type",
          COUNT(*)::int AS "count",
          COALESCE(SUM(e.score), 0)::int AS "totalScore"
        FROM school_mileage_entries e
        JOIN school_mileage_rules r ON r.id = e.rule_id
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
        FROM school_mileage_entries e
        JOIN school_mileage_rules r ON r.id = e.rule_id
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
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(query);
    const students = await findStudentsByFilters(this.prisma, {
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
      filters,
      students.map((student) => student.studentId),
    );
    const totalsByStudentId = buildStudentTotalsByStudentId(
      aggregateRows,
      SchoolMileageType.REWARD,
    );

    const summaries = students
      .filter((student) => totalsByStudentId.has(student.studentId))
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
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseAnalyticsFilters(query);
    const students = await findStudentsByFilters(this.prisma, {
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
      filters,
      students.map((student) => student.studentId),
    );
    const totalsByStudentId = buildStudentTotalsByStudentId(
      aggregateRows,
      SchoolMileageType.REWARD,
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

  private async getEntryTotalsByStudentId(
    filters: ReturnType<typeof parseAnalyticsFilters>,
    studentIds: string[],
  ) {
    if (studentIds.length === 0) {
      return [] as StudentAggregateRow[];
    }

    const groupedEntries = await this.prisma.schoolMileageEntry.groupBy({
      where: buildMileageEntryWhere(filters, studentIds),
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
    filters: ReturnType<typeof parseAnalyticsFilters>,
  ) {
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

    const students = await findStudentsByFilters(this.prisma, {
      school: filters.school,
      grade: filters.grade,
      classNumber: filters.classNumber,
      name: filters.name ?? filters.studentName,
      studentId: filters.studentId,
    });

    return students.map((student) => student.studentId);
  }
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
