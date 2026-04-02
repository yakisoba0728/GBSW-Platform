import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, School, SchoolMileageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type SchoolMileageApiType = 'reward' | 'penalty';

type StudentSummary = {
  studentId: string;
  name: string;
  school: School;
  grade: number | null;
  classNumber: number;
  studentNumber: number;
};

@Injectable()
export class SchoolMileageService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules(actorTeacherId: string | undefined) {
    await this.assertTeacherExists(actorTeacherId);

    const rules = await this.prisma.schoolMileageRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
      select: {
        id: true,
        type: true,
        category: true,
        name: true,
        defaultScore: true,
        displayOrder: true,
        isActive: true,
      },
    });

    return {
      rules: rules.map((rule) => ({
        id: rule.id,
        type: toApiMileageType(rule.type),
        category: rule.category,
        name: rule.name,
        defaultScore: rule.defaultScore,
        displayOrder: rule.displayOrder,
        isActive: rule.isActive,
      })),
    };
  }

  async getStudents(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await this.assertTeacherExists(actorTeacherId);

    const school = parseOptionalSchool(query.school);
    const grade = parseOptionalPositiveInt(query.year, '학년', 1, 3);
    const classNumber = parseOptionalPositiveInt(
      query.classNumber,
      '반',
      1,
      99,
    );
    const name = parseOptionalText(query.name);

    const students = await this.prisma.student.findMany({
      where: {
        school: school ?? undefined,
        currentClass: classNumber ?? undefined,
        name: name
          ? {
              contains: name,
              mode: 'insensitive',
            }
          : undefined,
      },
      orderBy: [
        { school: 'asc' },
        { currentClass: 'asc' },
        { currentNumber: 'asc' },
        { name: 'asc' },
      ],
      select: {
        studentId: true,
        name: true,
        school: true,
        currentYear: true,
        currentClass: true,
        currentNumber: true,
      },
    });

    const mapped = students
      .map<StudentSummary>((student) => ({
        studentId: student.studentId,
        name: student.name,
        school: student.school,
        grade: calculateStudentGrade(student.studentId, student.currentYear),
        classNumber: student.currentClass,
        studentNumber: student.currentNumber,
      }))
      .filter((student) => (grade ? student.grade === grade : true))
      .sort(compareStudentSummary);

    return { students: mapped };
  }

  async createEntries(
    actorTeacherId: string | undefined,
    body: Record<string, unknown>,
  ) {
    const teacher = await this.assertTeacherExists(actorTeacherId);
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
        },
        select: {
          studentId: true,
        },
      }),
      this.prisma.schoolMileageRule.findMany({
        where: {
          id: {
            in: ruleIds,
          },
          isActive: true,
        },
        select: {
          id: true,
          type: true,
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

      if (!rulesById.has(entry.ruleId)) {
        throw new NotFoundException(
          `사용할 수 없는 상벌점 항목입니다: ${entry.ruleId}`,
        );
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

        return this.prisma.schoolMileageEntry.create({
          data: {
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
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await this.assertTeacherExists(actorTeacherId);

    const school = parseOptionalSchool(query.school);
    const grade = parseOptionalPositiveInt(query.year, '학년', 1, 3);
    const type = parseOptionalMileageType(query.type);
    const page = parseOptionalPositiveInt(query.page, '페이지', 1, 100000) ?? 1;
    const pageSize =
      parseOptionalPositiveInt(query.pageSize, '페이지 크기', 1, 100) ?? 20;
    const studentName = parseOptionalText(query.studentName);
    const startDate = parseOptionalDate(query.startDate, 'start');
    const endDate = parseOptionalDate(query.endDate, 'end');

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        '조회 시작일은 종료일보다 늦을 수 없습니다.',
      );
    }

    const offset = (page - 1) * pageSize;
    const studentFilter =
      school || studentName
        ? {
            school: school ?? undefined,
            name: studentName
              ? {
                  contains: studentName,
                  mode: 'insensitive' as const,
                }
              : undefined,
          }
        : undefined;

    let matchingStudentIds: string[] | undefined;

    if (grade) {
      const students = await this.prisma.student.findMany({
        where: studentFilter,
        select: {
          studentId: true,
          currentYear: true,
        },
      });

      matchingStudentIds = students
        .filter(
          (student) =>
            calculateStudentGrade(student.studentId, student.currentYear) ===
            grade,
        )
        .map((student) => student.studentId);

      if (matchingStudentIds.length === 0) {
        return {
          items: [],
          page,
          pageSize,
          totalCount: 0,
        };
      }
    }

    const entryWhere: Prisma.SchoolMileageEntryWhereInput = {
      deletedAt: null,
      type: type ? toPrismaMileageType(type) : undefined,
      awardedAt:
        startDate || endDate
          ? {
              gte: startDate ?? undefined,
              lte: endDate ?? undefined,
            }
          : undefined,
      student: grade ? undefined : studentFilter,
      studentId: matchingStudentIds
        ? {
            in: matchingStudentIds,
          }
        : undefined,
    };
    const entryOrderBy: Prisma.SchoolMileageEntryOrderByWithRelationInput[] = [
      { awardedAt: 'desc' },
      { createdAt: 'desc' },
    ];
    const entrySelect = {
      id: true,
      type: true,
      score: true,
      reason: true,
      awardedAt: true,
      createdAt: true,
      updatedAt: true,
      rule: {
        select: {
          id: true,
          category: true,
          name: true,
          defaultScore: true,
        },
      },
      student: {
        select: {
          studentId: true,
          name: true,
          school: true,
          currentYear: true,
          currentClass: true,
          currentNumber: true,
        },
      },
      createdByTeacher: {
        select: {
          teacherId: true,
          name: true,
        },
      },
    } satisfies Prisma.SchoolMileageEntrySelect;

    const [totalCount, entries] = await Promise.all([
      this.prisma.schoolMileageEntry.count({
        where: entryWhere,
      }),
      this.prisma.schoolMileageEntry.findMany({
        where: entryWhere,
        orderBy: entryOrderBy,
        skip: offset,
        take: pageSize,
        select: entrySelect,
      }),
    ]);

    const items = entries.map((entry) => {
      const studentGrade = calculateStudentGrade(
        entry.student.studentId,
        entry.student.currentYear,
      );

      return {
        id: entry.id,
        type: toApiMileageType(entry.type),
        score: entry.score,
        reason: entry.reason,
        awardedAt: entry.awardedAt.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        ruleId: entry.rule.id,
        ruleCategory: entry.rule.category,
        ruleName: entry.rule.name,
        ruleDefaultScore: entry.rule.defaultScore,
        studentId: entry.student.studentId,
        studentName: entry.student.name,
        school: entry.student.school,
        grade: studentGrade,
        classNumber: entry.student.currentClass,
        studentNumber: entry.student.currentNumber,
        teacherId: entry.createdByTeacher.teacherId,
        teacherName: entry.createdByTeacher.name,
      };
    });

    return {
      items,
      page,
      pageSize,
      totalCount,
    };
  }

  async updateEntry(
    actorTeacherId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    const teacher = await this.assertTeacherExists(actorTeacherId);
    const entryId = parseRequiredPositiveInt(
      id,
      '상벌점 내역 ID',
      1,
      1000000000,
    );
    const updateInput = parseUpdateEntryInput(body);

    const existingEntry = await this.prisma.schoolMileageEntry.findFirst({
      where: {
        id: entryId,
        deletedAt: null,
      },
      select: {
        id: true,
        ruleId: true,
      },
    });

    if (!existingEntry) {
      throw new NotFoundException('상벌점 내역을 찾을 수 없습니다.');
    }

    let nextType: SchoolMileageType | undefined;

    if (updateInput.ruleId !== undefined) {
      const rule = await this.prisma.schoolMileageRule.findFirst({
        where: {
          id: updateInput.ruleId,
          isActive: true,
        },
        select: {
          id: true,
          type: true,
        },
      });

      if (!rule) {
        throw new NotFoundException('사용할 수 없는 상벌점 항목입니다.');
      }

      nextType = rule.type;
    }

    await this.prisma.schoolMileageEntry.update({
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

  async deleteEntry(actorTeacherId: string | undefined, id: string) {
    const teacher = await this.assertTeacherExists(actorTeacherId);
    const entryId = parseRequiredPositiveInt(
      id,
      '상벌점 내역 ID',
      1,
      1000000000,
    );

    const existingEntry = await this.prisma.schoolMileageEntry.findFirst({
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

    await this.prisma.schoolMileageEntry.update({
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

  private async assertTeacherExists(actorTeacherId: string | undefined) {
    const teacherId = parseRequiredText(actorTeacherId, '교사 계정');
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        teacherId,
      },
      select: {
        teacherId: true,
        name: true,
      },
    });

    if (!teacher) {
      throw new UnauthorizedException('유효한 교사 계정이 아닙니다.');
    }

    return teacher;
  }
}

function parseCreateEntryInput(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException('부여할 상벌점 내역이 없습니다.');
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException(
        `${index + 1}번째 상벌점 내역 형식이 올바르지 않습니다.`,
      );
    }

    const entry = item as Record<string, unknown>;

    return {
      studentId: parseRequiredText(entry.studentId, '학생 아이디'),
      ruleId: parseRequiredPositiveInt(
        entry.ruleId,
        '상벌점 항목',
        1,
        1000000000,
      ),
      score: parseRequiredPositiveInt(entry.score, '점수', 1, 1000000000),
      reason: parseOptionalText(entry.reason) ?? null,
    };
  });
}

function parseUpdateEntryInput(body: Record<string, unknown>) {
  const hasRuleId = body.ruleId !== undefined;
  const hasScore = body.score !== undefined;
  const hasReason = body.reason !== undefined;
  const hasAwardedAt = body.awardedAt !== undefined;

  if (!hasRuleId && !hasScore && !hasReason && !hasAwardedAt) {
    throw new BadRequestException('수정할 항목이 없습니다.');
  }

  return {
    ruleId: hasRuleId
      ? parseRequiredPositiveInt(body.ruleId, '상벌점 항목', 1, 1000000000)
      : undefined,
    score: hasScore
      ? parseRequiredPositiveInt(body.score, '점수', 1, 1000000000)
      : undefined,
    reasonProvided: hasReason,
    reason: hasReason ? (parseOptionalText(body.reason) ?? null) : undefined,
    awardedAt: hasAwardedAt
      ? parseRequiredDate(body.awardedAt, '부여 일시')
      : undefined,
  };
}

function parseOptionalSchool(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === School.GBSW || value === School.BYMS) {
    return value;
  }

  throw new BadRequestException('학교 정보가 올바르지 않습니다.');
}

function parseOptionalMileageType(
  value: unknown,
): SchoolMileageApiType | undefined {
  const text = parseOptionalText(value);

  if (!text) {
    return undefined;
  }

  if (text === 'reward' || text === 'penalty') {
    return text;
  }

  throw new BadRequestException('상벌점 구분이 올바르지 않습니다.');
}

function parseOptionalPositiveInt(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parseRequiredPositiveInt(value, label, min, max);
}

function parseRequiredPositiveInt(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  const text = toInputText(value);
  const parsed = Number.parseInt(text, 10);

  if (
    !/^\d+$/.test(text) ||
    Number.isNaN(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    throw new BadRequestException(`${label} 값이 올바르지 않습니다.`);
  }

  return parsed;
}

function parseRequiredText(value: unknown, label: string) {
  const text = toInputText(value);

  if (!text) {
    throw new BadRequestException(`${label} 정보가 올바르지 않습니다.`);
  }

  return text;
}

function parseOptionalText(value: unknown) {
  const text = toInputText(value);

  return text.length > 0 ? text : undefined;
}

function parseOptionalDate(value: unknown, direction: 'start' | 'end') {
  const text = parseOptionalText(value);

  if (!text) {
    return undefined;
  }

  return parseDateString(text, direction);
}

function parseRequiredDate(value: unknown, label: string) {
  const text = parseOptionalText(value);

  if (!text) {
    throw new BadRequestException(`${label}를 입력해주세요.`);
  }

  return parseDateString(text, 'start');
}

function parseDateString(value: string, direction: 'start' | 'end') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const suffix =
      direction === 'end' ? 'T23:59:59.999+09:00' : 'T00:00:00.000+09:00';
    const parsed = new Date(`${value}${suffix}`);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('날짜 형식이 올바르지 않습니다.');
  }

  return parsed;
}

function toInputText(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}`.trim();
  }

  if (Array.isArray(value) && value.length > 0) {
    return toInputText(value[0]);
  }

  return '';
}

function toApiMileageType(type: SchoolMileageType): SchoolMileageApiType {
  return type === 'REWARD' ? 'reward' : 'penalty';
}

function toPrismaMileageType(type: SchoolMileageApiType) {
  return type === 'reward'
    ? SchoolMileageType.REWARD
    : SchoolMileageType.PENALTY;
}

function calculateStudentGrade(studentId: string, currentYear: number) {
  const match = /^[A-Za-z]{2}(\d{2})/.exec(studentId);

  if (!match) {
    return null;
  }

  const admissionYearSuffix = Number.parseInt(match[1], 10);

  if (Number.isNaN(admissionYearSuffix)) {
    return null;
  }

  const currentCentury = Math.floor(currentYear / 100) * 100;
  let admissionYear = currentCentury + admissionYearSuffix;

  if (admissionYear > currentYear) {
    admissionYear -= 100;
  }

  const grade = currentYear - admissionYear + 1;

  if (grade < 1 || grade > 3) {
    return null;
  }

  return grade;
}

function compareStudentSummary(left: StudentSummary, right: StudentSummary) {
  return (
    compareNullableNumber(left.grade, right.grade) ||
    left.classNumber - right.classNumber ||
    left.studentNumber - right.studentNumber ||
    left.name.localeCompare(right.name, 'ko')
  );
}

function compareNullableNumber(left: number | null, right: number | null) {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}
