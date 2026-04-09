import { Injectable, NotFoundException } from '@nestjs/common';
import { MileageScope, School } from '@prisma/client';
import {
  assertTeacherExists,
  assertStudentExists,
} from '../common/auth-access';
import { PrismaService } from '../prisma/prisma.service';
import { assertDormTeacherOnly } from './mileage.access';
import {
  mapHistoryEntry,
  mapStudentHistoryEntry,
  mileageEntrySelect,
  toPrismaMileageType,
} from './mileage.mappers';
import {
  parseCreateEntryInput,
  parseEntryFilters,
  parseEntryId,
  parseUpdateEntryInput,
  validateScoreWithinRange,
} from './mileage.parsers';
import { findStudentsByFilters } from './mileage.students.data';

@Injectable()
export class MileageEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertTeacherReadAccess(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    if (scope === MileageScope.DORM) {
      return assertDormTeacherOnly(this.prisma, actorTeacherId, actorSessionId);
    }

    return assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);
  }

  async createEntries(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    const teacher =
      scope === MileageScope.DORM
        ? await assertDormTeacherOnly(
            this.prisma,
            actorTeacherId,
            actorSessionId,
          )
        : await assertTeacherExists(
            this.prisma,
            actorTeacherId,
            actorSessionId,
          );
    const entries = parseCreateEntryInput(body.entries);

    const studentIds = Array.from(
      new Set(entries.map((entry) => entry.studentId)),
    );
    const ruleIds = Array.from(new Set(entries.map((entry) => entry.ruleId)));

    const [students, rules] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          studentId: {
            in: studentIds,
          },
          isActive: true,
          school: scope === MileageScope.DORM ? School.GBSW : undefined,
        },
        select: {
          studentId: true,
        },
      }),
      this.prisma.mileageRule.findMany({
        where: {
          scope,
          id: {
            in: ruleIds,
          },
          isActive: true,
        },
        select: {
          id: true,
          type: true,
          minScore: true,
          maxScore: true,
        },
      }),
    ]);

    const existingStudentIds = new Set(
      students.map((student) => student.studentId),
    );
    const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

    for (const entry of entries) {
      if (!existingStudentIds.has(entry.studentId)) {
        throw new NotFoundException(
          `존재하지 않는 학생입니다: ${entry.studentId}`,
        );
      }

      const rule = rulesById.get(entry.ruleId);

      if (!rule) {
        throw new NotFoundException(
          `사용할 수 없는 상벌점 항목입니다: ${entry.ruleId}`,
        );
      }

      if (
        scope === MileageScope.DORM &&
        (rule.minScore !== null || rule.maxScore !== null)
      ) {
        validateScoreWithinRange(entry.score, rule.minScore, rule.maxScore);
      }
    }

    const awardedAt = new Date();

    await this.prisma.$transaction(
      entries.map((entry) => {
        const rule = rulesById.get(entry.ruleId);

        if (!rule) {
          throw new NotFoundException(
            `사용할 수 없는 상벌점 항목입니다: ${entry.ruleId}`,
          );
        }

        return this.prisma.mileageEntry.create({
          data: {
            scope,
            studentId: entry.studentId,
            ruleId: entry.ruleId,
            type: rule.type,
            score: entry.score,
            reason: entry.reason,
            awardedAt,
            createdByTeacherId: teacher.teacherId,
          },
        });
      }),
    );

    return {
      ok: true,
      message: '상벌점이 부여되었습니다.',
      createdCount: entries.length,
    };
  }

  async getEntries(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await this.assertTeacherReadAccess(scope, actorTeacherId, actorSessionId);

    const filters = parseEntryFilters(scope, query);
    const { page, pageSize } = filters;
    const offset = (page - 1) * pageSize;

    const matchedStudents = hasStudentScope(scope, filters)
      ? await findStudentsByFilters(this.prisma, scope, {
          school: filters.school,
          grade: filters.grade,
          classNumber: filters.classNumber,
          name: filters.name ?? filters.studentName,
          studentId: filters.studentId,
        })
      : null;

    if (matchedStudents && matchedStudents.length === 0) {
      return {
        items: [],
        page,
        pageSize,
        totalCount: 0,
      };
    }

    const studentIds = matchedStudents?.map((student) => student.studentId);

    const entryWhere = {
      scope,
      deletedAt: null,
      type: filters.type ? toPrismaMileageType(filters.type) : undefined,
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

    const [totalCount, entries] = await Promise.all([
      this.prisma.mileageEntry.count({
        where: entryWhere,
      }),
      this.prisma.mileageEntry.findMany({
        where: entryWhere,
        orderBy: [{ awardedAt: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: pageSize,
        select: mileageEntrySelect,
      }),
    ]);

    return {
      items: entries.map((entry) => mapHistoryEntry(scope, entry)),
      page,
      pageSize,
      totalCount,
    };
  }

  async getEntriesExport(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await this.assertTeacherReadAccess(scope, actorTeacherId, actorSessionId);

    const filters = parseEntryFilters(scope, query);

    const matchedStudents = hasStudentScope(scope, filters)
      ? await findStudentsByFilters(this.prisma, scope, {
          school: filters.school,
          grade: filters.grade,
          classNumber: filters.classNumber,
          name: filters.name ?? filters.studentName,
          studentId: filters.studentId,
        })
      : null;

    if (matchedStudents && matchedStudents.length === 0) {
      return {
        items: [],
        totalCount: 0,
      };
    }

    const studentIds = matchedStudents?.map((student) => student.studentId);

    const entryWhere = {
      scope,
      deletedAt: null,
      type: filters.type ? toPrismaMileageType(filters.type) : undefined,
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

    const entries = await this.prisma.mileageEntry.findMany({
      where: entryWhere,
      orderBy: [{ awardedAt: 'desc' }, { createdAt: 'desc' }],
      select: mileageEntrySelect,
    });

    return {
      items: entries.map((entry) => mapHistoryEntry(scope, entry)),
      totalCount: entries.length,
    };
  }

  async updateEntry(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    const teacher =
      scope === MileageScope.DORM
        ? await assertDormTeacherOnly(
            this.prisma,
            actorTeacherId,
            actorSessionId,
          )
        : await assertTeacherExists(
            this.prisma,
            actorTeacherId,
            actorSessionId,
          );
    const entryId = parseEntryId(id);
    const updateInput = parseUpdateEntryInput(body);

    const existingEntry = await this.prisma.mileageEntry.findFirst({
      where: {
        id: entryId,
        scope,
        deletedAt: null,
      },
      select: {
        id: true,
        score: true,
        rule: {
          select: {
            id: true,
            minScore: true,
            maxScore: true,
          },
        },
      },
    });

    if (!existingEntry) {
      throw new NotFoundException('상벌점 내역을 찾을 수 없습니다.');
    }

    let nextType;
    let nextRule = existingEntry.rule;

    if (updateInput.ruleId !== undefined) {
      const rule = await this.prisma.mileageRule.findFirst({
        where: {
          id: updateInput.ruleId,
          scope,
          isActive: true,
        },
        select: {
          id: true,
          type: true,
          minScore: true,
          maxScore: true,
        },
      });

      if (!rule) {
        throw new NotFoundException('사용할 수 없는 상벌점 항목입니다.');
      }

      nextType = rule.type;
      nextRule = rule;
    }

    if (scope === MileageScope.DORM) {
      const nextScore = updateInput.score ?? existingEntry.score;
      validateScoreWithinRange(nextScore, nextRule.minScore, nextRule.maxScore);
    }

    await this.prisma.mileageEntry.update({
      where: {
        id: existingEntry.id,
      },
      data: {
        ruleId: updateInput.ruleId,
        type: nextType,
        score: updateInput.score,
        reason:
          updateInput.reasonProvided === true ? updateInput.reason : undefined,
        awardedAt: updateInput.awardedAt,
        updatedByTeacherId: teacher.teacherId,
      },
    });

    return {
      ok: true,
      message: '상벌점 내역이 수정되었습니다.',
    };
  }

  async deleteEntry(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) {
    const teacher =
      scope === MileageScope.DORM
        ? await assertDormTeacherOnly(
            this.prisma,
            actorTeacherId,
            actorSessionId,
          )
        : await assertTeacherExists(
            this.prisma,
            actorTeacherId,
            actorSessionId,
          );
    const entryId = parseEntryId(id);

    const existingEntry = await this.prisma.mileageEntry.findFirst({
      where: {
        id: entryId,
        scope,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingEntry) {
      throw new NotFoundException('상벌점 내역을 찾을 수 없습니다.');
    }

    await this.prisma.mileageEntry.update({
      where: {
        id: existingEntry.id,
      },
      data: {
        deletedAt: new Date(),
        deletedByTeacherId: teacher.teacherId,
        updatedByTeacherId: teacher.teacherId,
      },
    });

    return {
      ok: true,
      message: '상벌점 내역이 삭제되었습니다.',
    };
  }

  async getMyEntries(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

    if (scope === MileageScope.DORM && student.school !== School.GBSW) {
      return {
        items: [],
        page: 1,
        pageSize: 20,
        totalCount: 0,
      };
    }

    const filters = parseEntryFilters(scope, {
      ...query,
      studentId: student.studentId,
    });
    const { page, pageSize } = filters;
    const offset = (page - 1) * pageSize;

    const entryWhere = {
      scope,
      deletedAt: null,
      studentId: student.studentId,
      type: filters.type ? toPrismaMileageType(filters.type) : undefined,
      awardedAt:
        filters.startDate || filters.endDate
          ? {
              gte: filters.startDate ?? undefined,
              lte: filters.endDate ?? undefined,
            }
          : undefined,
    };

    const [totalCount, entries] = await Promise.all([
      this.prisma.mileageEntry.count({
        where: entryWhere,
      }),
      this.prisma.mileageEntry.findMany({
        where: entryWhere,
        orderBy: [{ awardedAt: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: pageSize,
        select: mileageEntrySelect,
      }),
    ]);

    return {
      items: entries.map((entry) => mapStudentHistoryEntry(scope, entry)),
      page,
      pageSize,
      totalCount,
    };
  }

  async getMyEntriesExport(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

    if (scope === MileageScope.DORM && student.school !== School.GBSW) {
      return {
        items: [],
        totalCount: 0,
      };
    }

    const filters = parseEntryFilters(scope, {
      ...query,
      studentId: student.studentId,
    });

    const entryWhere = {
      scope,
      deletedAt: null,
      studentId: student.studentId,
      type: filters.type ? toPrismaMileageType(filters.type) : undefined,
      awardedAt:
        filters.startDate || filters.endDate
          ? {
              gte: filters.startDate ?? undefined,
              lte: filters.endDate ?? undefined,
            }
          : undefined,
    };

    const entries = await this.prisma.mileageEntry.findMany({
      where: entryWhere,
      orderBy: [{ awardedAt: 'desc' }, { createdAt: 'desc' }],
      select: mileageEntrySelect,
    });

    return {
      items: entries.map((entry) => mapStudentHistoryEntry(scope, entry)),
      totalCount: entries.length,
    };
  }
}

function hasStudentScope(
  scope: MileageScope,
  filters: {
    school?: unknown;
    grade?: unknown;
    name?: unknown;
    classNumber?: unknown;
    studentName?: unknown;
    studentId?: unknown;
  },
) {
  if (scope === MileageScope.SCHOOL) {
    return Boolean(
      filters.school ||
      filters.grade ||
      filters.classNumber ||
      filters.name ||
      filters.studentName ||
      filters.studentId,
    );
  }

  return Boolean(
    filters.grade ||
    filters.classNumber ||
    filters.name ||
    filters.studentName ||
    filters.studentId,
  );
}
