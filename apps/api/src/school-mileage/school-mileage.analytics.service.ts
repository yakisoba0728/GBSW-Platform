import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertTeacherExists } from './school-mileage.access';
import {
  buildClassMileageSummary,
  buildStudentMileageSummary,
  compareStudentMileageSummary,
  schoolMileageEntrySelect,
  toApiMileageType,
} from './school-mileage.mappers';
import { parseAnalyticsFilters } from './school-mileage.parsers';
import { findStudentsByFilters } from './school-mileage.students.data';

@Injectable()
export class SchoolMileageAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId);

    const filters = parseAnalyticsFilters(query);
    const studentIds = await this.resolveStudentIds(filters);

    if (studentIds && studentIds.length === 0) {
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

    const entries = await this.prisma.schoolMileageEntry.findMany({
      where: buildEntryWhere(filters, studentIds),
      orderBy: [{ awardedAt: 'desc' }, { createdAt: 'desc' }],
      select: schoolMileageEntrySelect,
    });

    const rewardEntries = entries.filter((entry) => entry.type === 'REWARD');
    const penaltyEntries = entries.filter((entry) => entry.type === 'PENALTY');
    const categoryMap = new Map<
      string,
      {
        category: string;
        type: 'reward' | 'penalty';
        count: number;
        totalScore: number;
      }
    >();
    const ruleMap = new Map<
      number,
      {
        ruleId: number;
        ruleName: string;
        category: string;
        type: 'reward' | 'penalty';
        count: number;
        totalScore: number;
      }
    >();

    for (const entry of entries) {
      const type = toApiMileageType(entry.type);
      const categoryKey = `${type}:${entry.rule.category}`;
      const nextCategory = categoryMap.get(categoryKey) ?? {
        category: entry.rule.category,
        type,
        count: 0,
        totalScore: 0,
      };

      nextCategory.count += 1;
      nextCategory.totalScore += entry.score;
      categoryMap.set(categoryKey, nextCategory);

      const nextRule = ruleMap.get(entry.rule.id) ?? {
        ruleId: entry.rule.id,
        ruleName: entry.rule.name,
        category: entry.rule.category,
        type,
        count: 0,
        totalScore: 0,
      };

      nextRule.count += 1;
      nextRule.totalScore += entry.score;
      ruleMap.set(entry.rule.id, nextRule);
    }

    return {
      summary: {
        rewardCount: rewardEntries.length,
        penaltyCount: penaltyEntries.length,
        rewardSum: rewardEntries.reduce((acc, entry) => acc + entry.score, 0),
        penaltySum: penaltyEntries.reduce((acc, entry) => acc + entry.score, 0),
        uniqueStudents: new Set(entries.map((entry) => entry.student.studentId))
          .size,
        totalCount: entries.length,
      },
      categoryStats: [...categoryMap.values()].sort(
        (left, right) =>
          right.count - left.count || right.totalScore - left.totalScore,
      ),
      topRules: [...ruleMap.values()]
        .sort(
          (left, right) =>
            right.count - left.count || right.totalScore - left.totalScore,
        )
        .slice(0, 5),
    };
  }

  async getStudentAnalytics(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId);

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

    const entries = await this.prisma.schoolMileageEntry.findMany({
      where: buildEntryWhere(
        filters,
        students.map((student) => student.studentId),
      ),
      select: {
        studentId: true,
        type: true,
        score: true,
      },
    });

    if (entries.length === 0) {
      return { students: [], totalCount: 0 };
    }

    const entriesByStudentId = new Map<
      string,
      Array<{ type: 'REWARD' | 'PENALTY'; score: number }>
    >();

    for (const entry of entries) {
      const nextEntries = entriesByStudentId.get(entry.studentId) ?? [];

      nextEntries.push({
        type: entry.type,
        score: entry.score,
      });
      entriesByStudentId.set(entry.studentId, nextEntries);
    }

    const summaries = students
      .filter((student) => entriesByStudentId.has(student.studentId))
      .map((student) =>
        buildStudentMileageSummary(
          student,
          entriesByStudentId.get(student.studentId) ?? [],
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
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId);

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

    const entries = await this.prisma.schoolMileageEntry.findMany({
      where: buildEntryWhere(
        filters,
        students.map((student) => student.studentId),
      ),
      select: {
        studentId: true,
        type: true,
        score: true,
      },
    });

    const entriesByStudentId = new Map<
      string,
      Array<{ type: 'REWARD' | 'PENALTY'; score: number }>
    >();

    for (const entry of entries) {
      const nextEntries = entriesByStudentId.get(entry.studentId) ?? [];

      nextEntries.push({
        type: entry.type,
        score: entry.score,
      });
      entriesByStudentId.set(entry.studentId, nextEntries);
    }

    const studentsByClassNumber = new Map<number, typeof students>();

    for (const student of students) {
      const nextStudents = studentsByClassNumber.get(student.classNumber) ?? [];

      nextStudents.push(student);
      studentsByClassNumber.set(student.classNumber, nextStudents);
    }

    const classes = [...studentsByClassNumber.entries()]
      .map(([classNumber, classStudents]) =>
        buildClassMileageSummary(
          classNumber,
          classStudents.map((student) =>
            buildStudentMileageSummary(
              student,
              entriesByStudentId.get(student.studentId) ?? [],
            ),
          ),
        ),
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
