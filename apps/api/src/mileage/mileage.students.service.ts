import { Injectable, NotFoundException } from '@nestjs/common';
import { MileageScope, MileageType, School } from '@prisma/client';
import {
  assertTeacherExists,
  assertTeacherReadAccess,
  assertStudentExists,
} from '../common/auth-access';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildStudentMileageSummary,
  mapStudentSummary,
} from './mileage.mappers';
import { parseAnalyticsFilters, parseStudentFilters } from './mileage.parsers';
import { findStudentsByFilters } from './mileage.students.data';

@Injectable()
export class MileageStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudents(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const students = await findStudentsByFilters(
      this.prisma,
      scope,
      parseStudentFilters(scope, query),
    );

    return { students };
  }

  async getStudentSummary(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    studentId: string,
    query: Record<string, unknown>,
  ) {
    await assertTeacherReadAccess(
      this.prisma,
      scope,
      actorTeacherId,
      actorSessionId,
    );

    const [student] = await findStudentsByFilters(this.prisma, scope, {
      ...parseAnalyticsFilters(scope, query),
      studentId,
    });

    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    const entries = await this.prisma.mileageEntry.findMany({
      where: {
        scope,
        deletedAt: null,
        studentId: student.studentId,
      },
      select: {
        type: true,
        score: true,
      },
    });

    return {
      summary: buildStudentMileageSummary(student, entries),
    };
  }

  async getMyDormAccess(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    const teacher = await assertTeacherExists(
      this.prisma,
      actorTeacherId,
      actorSessionId,
    );

    const dormTeacher = await this.prisma.teacher.findFirst({
      where: {
        teacherId: teacher.teacherId,
        isActive: true,
      },
      select: { isDormTeacher: true },
    });

    return { isDormTeacher: dormTeacher?.isDormTeacher === true };
  }

  async getMyMileageStats(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

    if (scope === MileageScope.DORM && student.school !== School.GBSW) {
      return {
        summary: {
          rewardTotal: 0,
          penaltyTotal: 0,
          netScore: 0,
          entryCount: 0,
        },
        categoryStats: { reward: [], penalty: [] },
        monthlyStats: [],
      };
    }

    const entries = await this.prisma.mileageEntry.findMany({
      where: {
        scope,
        deletedAt: null,
        studentId: student.studentId,
      },
      select: {
        type: true,
        score: true,
        awardedAt: true,
        rule: { select: { category: true } },
      },
    });

    let rewardTotal = 0;
    let penaltyTotal = 0;
    const rewardByCategory = new Map<string, number>();
    const penaltyByCategory = new Map<string, number>();

    for (const entry of entries) {
      if (entry.type === MileageType.REWARD) {
        rewardTotal += entry.score;
        rewardByCategory.set(
          entry.rule.category,
          (rewardByCategory.get(entry.rule.category) ?? 0) + entry.score,
        );
      } else {
        penaltyTotal += entry.score;
        penaltyByCategory.set(
          entry.rule.category,
          (penaltyByCategory.get(entry.rule.category) ?? 0) + entry.score,
        );
      }
    }

    const now = new Date();
    const monthlyStats: Array<{
      key: string;
      label: string;
      reward: number;
      penalty: number;
    }> = [];

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = `${month + 1}월`;
      let reward = 0;
      let penalty = 0;

      for (const entry of entries) {
        if (
          entry.awardedAt.getFullYear() === year &&
          entry.awardedAt.getMonth() === month
        ) {
          if (entry.type === MileageType.REWARD) {
            reward += entry.score;
          } else {
            penalty += entry.score;
          }
        }
      }

      monthlyStats.push({ key, label, reward, penalty });
    }

    return {
      summary: {
        rewardTotal,
        penaltyTotal,
        netScore: rewardTotal - penaltyTotal,
        entryCount: entries.length,
      },
      categoryStats: {
        reward: [...rewardByCategory.entries()]
          .map(([category, total]) => ({ category, total }))
          .sort((a, b) => b.total - a.total),
        penalty: [...penaltyByCategory.entries()]
          .map(([category, total]) => ({ category, total }))
          .sort((a, b) => b.total - a.total),
      },
      monthlyStats,
    };
  }

  async getMyMileageSummary(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

    if (scope === MileageScope.DORM && student.school !== School.GBSW) {
      return {
        summary: buildStudentMileageSummary(mapStudentSummary(student), []),
      };
    }

    const entries = await this.prisma.mileageEntry.findMany({
      where: {
        scope,
        deletedAt: null,
        studentId: student.studentId,
      },
      select: {
        type: true,
        score: true,
      },
    });

    return {
      summary: buildStudentMileageSummary(mapStudentSummary(student), entries),
    };
  }
}
