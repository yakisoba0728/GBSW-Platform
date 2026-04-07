import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { School } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertDormTeacherOnly,
  assertTeacherExists,
  assertStudentExists,
} from './dorm-mileage.access';
import {
  dormMileageEntrySelect,
  mapHistoryEntry,
  mapStudentHistoryEntry,
  toPrismaDormMileageType,
} from './dorm-mileage.mappers';
import {
  parseCreateEntryInput,
  parseEntryFilters,
  parseEntryId,
  parseUpdateEntryInput,
} from './dorm-mileage.parsers';
import { findDormStudentsByFilters } from './dorm-mileage.students.data';

@Injectable()
export class DormMileageEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createEntries(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    const actor = await assertDormTeacherOnly(
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
          school: School.GBSW,
        },
        select: {
          studentId: true,
        },
      }),
      this.prisma.dormMileageRule.findMany({
        where: {
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

      if (rule.minScore !== null && rule.maxScore !== null) {
        if (entry.score < rule.minScore || entry.score > rule.maxScore) {
          throw new BadRequestException(
            `점수는 ${rule.minScore}~${rule.maxScore} 범위여야 합니다`,
          );
        }
      }
    }

    const awardedAt = new Date();
    const createdByTeacherId = actor.teacherId;

    await this.prisma.$transaction(
      entries.map((entry) => {
        const rule = rulesById.get(entry.ruleId);

        if (!rule) {
          throw new NotFoundException(
            `사용할 수 없는 상벌점 항목입니다: ${entry.ruleId}`,
          );
        }

        return this.prisma.dormMileageEntry.create({
          data: {
            studentId: entry.studentId,
            ruleId: entry.ruleId,
            type: rule.type,
            score: entry.score,
            reason: entry.reason,
            awardedAt,
            createdByTeacherId,
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
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const filters = parseEntryFilters(query);
    const { page, pageSize } = filters;
    const offset = (page - 1) * pageSize;

    const matchedStudents = hasStudentScope(filters)
      ? await findDormStudentsByFilters(this.prisma, {
          grade: filters.grade,
          classNumber: filters.classNumber,
          name: filters.studentName,
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
      deletedAt: null,
      type: filters.type ? toPrismaDormMileageType(filters.type) : undefined,
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
      this.prisma.dormMileageEntry.count({
        where: entryWhere,
      }),
      this.prisma.dormMileageEntry.findMany({
        where: entryWhere,
        orderBy: [{ awardedAt: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: pageSize,
        select: dormMileageEntrySelect,
      }),
    ]);

    return {
      items: entries.map(mapHistoryEntry),
      page,
      pageSize,
      totalCount,
    };
  }

  async updateEntry(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    const actor = await assertDormTeacherOnly(
      this.prisma,
      actorTeacherId,
      actorSessionId,
    );
    const entryId = parseEntryId(id);
    const updateInput = parseUpdateEntryInput(body);

    const existingEntry = await this.prisma.dormMileageEntry.findFirst({
      where: {
        id: entryId,
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
      const rule = await this.prisma.dormMileageRule.findFirst({
        where: {
          id: updateInput.ruleId,
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

    const nextScore = updateInput.score ?? existingEntry.score;

    if (nextRule.minScore !== null && nextRule.maxScore !== null) {
      if (nextScore < nextRule.minScore || nextScore > nextRule.maxScore) {
        throw new BadRequestException(
          `점수는 ${nextRule.minScore}~${nextRule.maxScore} 범위여야 합니다`,
        );
      }
    }

    const updatedByTeacherId = actor.teacherId;

    await this.prisma.dormMileageEntry.update({
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
        updatedByTeacherId,
      },
    });

    return {
      ok: true,
      message: '상벌점 내역이 수정되었습니다.',
    };
  }

  async deleteEntry(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) {
    const actor = await assertDormTeacherOnly(
      this.prisma,
      actorTeacherId,
      actorSessionId,
    );
    const entryId = parseEntryId(id);

    const existingEntry = await this.prisma.dormMileageEntry.findFirst({
      where: {
        id: entryId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingEntry) {
      throw new NotFoundException('상벌점 내역을 찾을 수 없습니다.');
    }

    const deletedByTeacherId = actor.teacherId;

    await this.prisma.dormMileageEntry.update({
      where: {
        id: existingEntry.id,
      },
      data: {
        deletedAt: new Date(),
        deletedByTeacherId,
        updatedByTeacherId: deletedByTeacherId,
      },
    });

    return {
      ok: true,
      message: '상벌점 내역이 삭제되었습니다.',
    };
  }

  async getMyEntries(
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

    if (student.school !== School.GBSW) {
      return {
        items: [],
        page: 1,
        pageSize: 20,
        totalCount: 0,
      };
    }

    const filters = parseEntryFilters({
      ...query,
      studentId: student.studentId,
    });
    const { page, pageSize } = filters;
    const offset = (page - 1) * pageSize;

    const entryWhere = {
      deletedAt: null,
      studentId: student.studentId,
      type: filters.type ? toPrismaDormMileageType(filters.type) : undefined,
      awardedAt:
        filters.startDate || filters.endDate
          ? {
              gte: filters.startDate ?? undefined,
              lte: filters.endDate ?? undefined,
            }
          : undefined,
    };

    const [totalCount, entries] = await Promise.all([
      this.prisma.dormMileageEntry.count({
        where: entryWhere,
      }),
      this.prisma.dormMileageEntry.findMany({
        where: entryWhere,
        orderBy: [{ awardedAt: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: pageSize,
        select: dormMileageEntrySelect,
      }),
    ]);

    return {
      items: entries.map(mapStudentHistoryEntry),
      page,
      pageSize,
      totalCount,
    };
  }
}

function hasStudentScope(filters: {
  grade?: unknown;
  classNumber?: unknown;
  studentName?: unknown;
  studentId?: unknown;
}) {
  return Boolean(
    filters.grade ||
    filters.classNumber ||
    filters.studentName ||
    filters.studentId,
  );
}
