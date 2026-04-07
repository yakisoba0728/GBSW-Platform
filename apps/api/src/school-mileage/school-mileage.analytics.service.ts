import { Injectable } from '@nestjs/common';
import { Prisma, SchoolMileageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertTeacherExists } from './school-mileage.access';
import {
  buildClassMileageSummary,
  compareStudentMileageSummary,
  toApiMileageType,
} from './school-mileage.mappers';
import { parseAnalyticsFilters } from './school-mileage.parsers';
import { findStudentsByFilters } from './school-mileage.students.data';
import type {
  OverviewSummary,
  StudentMileageSummary,
} from './school-mileage.types';

type OverviewAggregateRow = {
  rewardCount: number;
  penaltyCount: number;
  rewardSum: number;
  penaltySum: number;
  uniqueStudents: number;
};

type CategoryAggregateRow = {
  category: string;
  type: SchoolMileageType;
  count: number;
  totalScore: number;
};

type TopRuleAggregateRow = {
  ruleId: number;
  ruleName: string;
  category: string;
  type: SchoolMileageType;
  count: number;
  totalScore: number;
};

function buildOverviewWhereSql(
  filters: ReturnType<typeof parseAnalyticsFilters>,
  studentIds: string[] | undefined,
) {
  const conditions: Prisma.Sql[] = [Prisma.sql`e.deleted_at IS NULL`];

  if (filters.startDate) {
    conditions.push(Prisma.sql`e.awarded_at >= ${filters.startDate}`);
  }

  if (filters.endDate) {
    conditions.push(Prisma.sql`e.awarded_at <= ${filters.endDate}`);
  }

  if (studentIds && studentIds.length > 0) {
    conditions.push(Prisma.sql`e.student_id IN (${Prisma.join(studentIds)})`);
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
}

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
      return {
        summary: emptyOverviewSummary(),
        categoryStats: [],
        topRules: [],
      };
    }

    const whereSql = buildOverviewWhereSql(filters, studentIds);

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
      summary: buildOverviewSummary(
        row?.rewardCount ?? 0,
        row?.penaltyCount ?? 0,
        row?.rewardSum ?? 0,
        row?.penaltySum ?? 0,
        row?.uniqueStudents ?? 0,
      ),
      categoryStats: categoryStats.map((stat) => ({
        category: stat.category,
        type: toApiMileageType(stat.type),
        count: stat.count,
        totalScore: stat.totalScore,
      })),
      topRules: topRules.map((rule) => ({
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        category: rule.category,
        type: toApiMileageType(rule.type),
        count: rule.count,
        totalScore: rule.totalScore,
      })),
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

    const totalsByStudentId = await this.getEntryTotalsByStudentId(
      filters,
      students.map((student) => student.studentId),
    );

    const summaries = students
      .map((student) => {
        const totals = totalsByStudentId.get(student.studentId);

        if (!totals || totals.entryCount === 0) {
          return null;
        }

        return toStudentMileageSummary(student, totals);
      })
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
      return {
        classes: [],
        overall: {
          classCount: 0,
          totalStudents: 0,
          rewardTotal: 0,
          penaltyTotal: 0,
          netScore: 0,
        },
      };
    }

    const totalsByStudentId = await this.getEntryTotalsByStudentId(
      filters,
      students.map((student) => student.studentId),
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
      return new Map<string, StudentMileageTotals>();
    }

    const aggregatedEntries = await this.prisma.schoolMileageEntry.groupBy({
      where: buildEntryWhere(filters, studentIds),
      by: ['studentId', 'type'],
      _count: {
        _all: true,
      },
      _sum: {
        score: true,
      },
    });

    const totalsByStudentId = new Map<string, StudentMileageTotals>();

    for (const aggregate of aggregatedEntries) {
      const nextTotals = totalsByStudentId.get(aggregate.studentId) ?? {
        rewardTotal: 0,
        penaltyTotal: 0,
        entryCount: 0,
      };

      const count = aggregate._count._all;
      const totalScore = aggregate._sum.score ?? 0;

      nextTotals.entryCount += count;
      if (aggregate.type === 'REWARD') {
        nextTotals.rewardTotal += totalScore;
      } else {
        nextTotals.penaltyTotal += totalScore;
      }

      totalsByStudentId.set(aggregate.studentId, nextTotals);
    }

    return totalsByStudentId;
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

function buildEntryWhere(
  filters: ReturnType<typeof parseAnalyticsFilters>,
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
    studentId: studentIds
      ? {
          in: studentIds,
        }
      : undefined,
  };
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
  totals: StudentMileageTotals | undefined,
): StudentMileageSummary {
  const nextTotals = totals ?? {
    rewardTotal: 0,
    penaltyTotal: 0,
    entryCount: 0,
  };

  return {
    studentId: student.studentId,
    name: student.name,
    school: student.school,
    grade: student.grade,
    classNumber: student.classNumber,
    studentNumber: student.studentNumber,
    rewardTotal: nextTotals.rewardTotal,
    penaltyTotal: nextTotals.penaltyTotal,
    netScore: nextTotals.rewardTotal - nextTotals.penaltyTotal,
    entryCount: nextTotals.entryCount,
  };
}

function buildOverviewSummary(
  rewardCount: number,
  penaltyCount: number,
  rewardSum: number,
  penaltySum: number,
  uniqueStudents: number,
): OverviewSummary {
  return {
    rewardCount,
    penaltyCount,
    rewardSum,
    penaltySum,
    uniqueStudents,
    totalCount: rewardCount + penaltyCount,
  };
}

function emptyOverviewSummary(): OverviewSummary {
  return buildOverviewSummary(0, 0, 0, 0, 0);
}

type StudentMileageTotals = {
  rewardTotal: number;
  penaltyTotal: number;
  entryCount: number;
};
