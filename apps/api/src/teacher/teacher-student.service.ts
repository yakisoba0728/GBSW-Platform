import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hashPassword } from '../auth/password';
import {
  buildStudentId,
  generateTemporaryPassword,
  isUniqueConstraintError,
  parseOptionalCurrentNumber,
  parseOptionalMajorSubject,
  parseOptionalPhone,
  parseOptionalRequiredText,
  parsePositiveInt,
  parseSchool,
} from '../admin/admin.parsers';
import { calculateStudentGrade } from '../common/mileage-summary';
import { parseOptionalTextInput } from '../common/parsers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherStudentService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudents(query: Record<string, unknown>) {
    const year = query.year
      ? parsePositiveInt(query.year, '학년', 1, 3)
      : undefined;
    const classNum = query.class
      ? parsePositiveInt(query.class, '반', 1, 99)
      : undefined;
    const majorSubject = parseOptionalTextInput(query.majorSubject);
    const search =
      typeof query.search === 'string' && query.search.trim()
        ? query.search.trim()
        : undefined;
    const page = query.page
      ? parsePositiveInt(query.page, '페이지', 1, 10000)
      : 1;
    const limit = query.limit
      ? parsePositiveInt(query.limit, '한도', 1, 200)
      : 50;

    const where: Prisma.StudentWhereInput = {
      ...(classNum !== undefined ? { currentClass: classNum } : {}),
      ...(majorSubject
        ? { majorSubject: { contains: majorSubject, mode: 'insensitive' } }
        : {}),
      ...(search
        ? {
            OR: [
              { studentId: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const students = await this.prisma.student.findMany({
      where,
      select: studentSelect,
    });
    const normalizedStudents = students
      .map(serializeStudent)
      .filter((student) => (year ? student.currentYear === year : true))
      .sort(compareStudents);
    const total = normalizedStudents.length;
    const offset = (page - 1) * limit;

    return {
      students: normalizedStudents.slice(offset, offset + limit),
      total,
    };
  }

  async getStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentId },
      select: studentSelect,
    });

    if (!student) throw new NotFoundException('학생을 찾을 수 없습니다.');

    return { student: serializeStudent(student) };
  }

  async createStudent(body: Record<string, unknown>) {
    const school = parseSchool(body.school);
    const year = parsePositiveInt(body.year, '학년', 1, 3);
    const classNum = parsePositiveInt(body.class, '반', 1, 99);
    const number = parsePositiveInt(body.number, '번호', 1, 99);
    const majorSubject = parseOptionalMajorSubject(body.majorSubject);

    const calendarYear = new Date().getFullYear();
    const studentId = buildStudentId(school, calendarYear, classNum, number);
    const temporaryPassword = generateTemporaryPassword(studentId);

    try {
      const student = await this.prisma.student.create({
        data: {
          studentId,
          school,
          currentYear: year,
          currentClass: classNum,
          currentNumber: number,
          majorSubject,
          passwordHash: hashPassword(temporaryPassword),
          mustChangePassword: true,
          isActive: true,
        },
        select: studentSelect,
      });

      return { ...serializeStudent(student), temporaryPassword };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('이미 존재하는 학번입니다.');
      }
      throw error;
    }
  }

  async createStudentsBulk(body: Record<string, unknown>) {
    const school = parseSchool(body.school);
    const year = parsePositiveInt(body.year, '학년', 1, 3);
    const classNum = parsePositiveInt(body.class, '반', 1, 99);
    const majorSubject = parseOptionalMajorSubject(body.majorSubject);
    const startNumber = parsePositiveInt(body.startNumber, '시작 번호', 1, 99);
    const endNumber = parsePositiveInt(body.endNumber, '끝 번호', 1, 99);

    if (startNumber > endNumber) {
      throw new BadRequestException(
        '시작 번호는 끝 번호보다 작거나 같아야 합니다.',
      );
    }

    const calendarYear = new Date().getFullYear();
    const created: {
      studentId: string;
      currentYear: number;
      currentClass: number;
      currentNumber: number;
      majorSubject: string | null;
      temporaryPassword: string;
    }[] = [];
    const skipped: { studentId: string; reason: string }[] = [];

    for (let num = startNumber; num <= endNumber; num++) {
      const studentId = buildStudentId(school, calendarYear, classNum, num);
      const temporaryPassword = generateTemporaryPassword(studentId);

      try {
        await this.prisma.student.create({
          data: {
            studentId,
            school,
            currentYear: year,
            currentClass: classNum,
            currentNumber: num,
            majorSubject,
            passwordHash: hashPassword(temporaryPassword),
            mustChangePassword: true,
            isActive: true,
          },
        });
        created.push({
          studentId,
          currentYear: year,
          currentClass: classNum,
          currentNumber: num,
          majorSubject: majorSubject ?? null,
          temporaryPassword,
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          skipped.push({ studentId, reason: '이미 존재하는 학번' });
        } else {
          throw error;
        }
      }
    }

    return { created, skipped };
  }

  async updateStudent(studentId: string, body: Record<string, unknown>) {
    const data: Prisma.StudentUpdateInput = {};

    if (body.name !== undefined)
      data.name = parseOptionalRequiredText(body.name, '이름') ?? null;
    if (body.phone !== undefined)
      data.phone = parseOptionalPhone(body.phone) ?? null;
    if (body.email !== undefined) {
      const email = parseOptionalTextInput(body.email);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestException('올바른 이메일 형식을 입력해주세요.');
      }
      data.email = email ?? null;
    }
    if (body.year !== undefined)
      data.currentYear = parseOptionalGrade(body.year);
    if (body.class !== undefined)
      data.currentClass =
        parseOptionalCurrentNumber(body.class, '반') ?? undefined;
    if (body.number !== undefined)
      data.currentNumber =
        parseOptionalCurrentNumber(body.number, '번호') ?? undefined;
    if (body.majorSubject !== undefined)
      data.majorSubject = parseOptionalMajorSubject(body.majorSubject) ?? null;
    if (body.isActive !== undefined) {
      const isActive =
        typeof body.isActive === 'boolean'
          ? body.isActive
          : body.isActive === 'true';
      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('변경할 값을 하나 이상 입력해주세요.');
    }

    const isActive = data.isActive;

    try {
      const student = await this.prisma.student.update({
        where: { studentId },
        data,
        select: studentSelect,
      });

      if (isActive === false) {
        await this.prisma.authSession.updateMany({
          where: { accountId: studentId, role: 'STUDENT', revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return { ok: true, student: serializeStudent(student) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('학생을 찾을 수 없습니다.');
      }
      throw error;
    }
  }

  async deleteStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentId },
      select: { studentId: true },
    });

    if (!student) throw new NotFoundException('학생을 찾을 수 없습니다.');

    const mileageEntryCount = await this.prisma.mileageEntry.count({
      where: { studentId },
    });

    if (mileageEntryCount > 0) {
      throw new BadRequestException(
        '상벌점 기록이 있는 학생은 삭제할 수 없습니다. 계정을 비활성화해주세요.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { accountId: studentId, role: 'STUDENT', revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.student.delete({ where: { studentId } });
    });

    return { success: true };
  }

  async resetPassword(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentId },
      select: { studentId: true },
    });

    if (!student) throw new NotFoundException('학생을 찾을 수 없습니다.');

    const newPassword = generateTemporaryPassword(studentId);

    await this.prisma.$transaction([
      this.prisma.student.update({
        where: { studentId },
        data: {
          passwordHash: hashPassword(newPassword),
          mustChangePassword: true,
        },
      }),
      this.prisma.authSession.updateMany({
        where: { accountId: studentId, role: 'STUDENT', revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { studentId, newPassword };
  }
}

const studentSelect = {
  studentId: true,
  school: true,
  currentYear: true,
  currentClass: true,
  currentNumber: true,
  majorSubject: true,
  name: true,
  phone: true,
  email: true,
  hasLinkedPhone: true,
  hasLinkedEmail: true,
  isActive: true,
} as const;

type TeacherStudentRecord = Prisma.StudentGetPayload<{
  select: typeof studentSelect;
}>;

function parseOptionalGrade(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parsePositiveInt(value, '학년', 1, 3);
}

function serializeStudent(student: TeacherStudentRecord) {
  const currentGrade =
    calculateStudentGrade(student.studentId, student.currentYear) ??
    student.currentYear;

  return {
    ...student,
    currentYear: currentGrade,
  };
}

function compareStudents(
  left: ReturnType<typeof serializeStudent>,
  right: ReturnType<typeof serializeStudent>,
) {
  return (
    left.currentYear - right.currentYear ||
    left.currentClass - right.currentClass ||
    left.currentNumber - right.currentNumber ||
    left.studentId.localeCompare(right.studentId, 'ko')
  );
}
