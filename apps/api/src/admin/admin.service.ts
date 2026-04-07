import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../auth/password';
import {
  buildStudentId,
  generateTemporaryPassword,
  isUniqueConstraintError,
  parseBoolean,
  parseMajorSubject,
  parseOptionalCurrentNumber,
  parseOptionalMajorSubject,
  parseOptionalPhone,
  parseOptionalRequiredText,
  parseOptionalSchool,
  parseOptionalYear,
  parsePhone,
  parsePositiveInt,
  parseRequiredText,
  parseSchool,
  parseTeacherId,
  parseYear,
  parseYearWithLabel,
} from './admin.parsers';

function isNotFoundError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentMajorSubjects() {
    const students = await this.prisma.student.findMany({
      select: {
        majorSubject: true,
      },
      orderBy: {
        majorSubject: 'asc',
      },
    });

    const majorSubjects = Array.from(
      new Set(
        students
          .map((student) => student.majorSubject?.trim() ?? '')
          .filter((subject) => subject.length > 0),
      ),
    );

    return { majorSubjects };
  }

  async getStudents(query: Record<string, unknown>) {
    const search = readOptionalSearch(query.search);
    const school = parseOptionalSchool(query.school);
    const isActive = readOptionalBoolean(query.isActive);

    const students = await this.prisma.student.findMany({
      where: {
        school,
        isActive,
        OR: search
          ? [
              { studentId: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { majorSubject: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: [
        { isActive: 'desc' },
        { school: 'asc' },
        { currentYear: 'asc' },
        { currentClass: 'asc' },
        { currentNumber: 'asc' },
      ],
      select: studentSummarySelect,
    });

    return {
      students,
    };
  }

  async getStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentId: id },
      select: studentSummarySelect,
    });

    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    return { student };
  }

  async createStudent(body: Record<string, unknown>) {
    const school = parseSchool(body.school);
    const admissionYear = parseYear(body.admissionYear);
    const classNumber = parsePositiveInt(body.classNumber, '반', 1, 99);
    const studentNumber = parsePositiveInt(body.studentNumber, '번호', 1, 99);
    const isFirstEnrollment = parseBoolean(body.isFirstEnrollment);
    const currentYear = isFirstEnrollment
      ? admissionYear
      : parseYearWithLabel(body.currentYear, '현재 년도');
    const currentClass = isFirstEnrollment
      ? classNumber
      : parsePositiveInt(body.currentClassNumber, '현재 반', 1, 99);
    const currentNumber = isFirstEnrollment
      ? studentNumber
      : parsePositiveInt(body.currentStudentNumber, '현재 번호', 1, 99);
    const majorSubject = parseMajorSubject(body.majorSubject);
    const name = parseRequiredText(body.name, '이름');
    const phone = parsePhone(body.phone);
    const studentId = buildStudentId(
      school,
      admissionYear,
      classNumber,
      studentNumber,
    );
    const temporaryPassword = generateTemporaryPassword();

    try {
      const student = await this.prisma.student.create({
        data: {
          studentId,
          school,
          currentYear,
          currentClass,
          currentNumber,
          majorSubject,
          name,
          phone,
          passwordHash: hashPassword(temporaryPassword),
          mustChangePassword: true,
          isActive: true,
        },
        select: studentSummarySelect,
      });

      return {
        message: '학생 계정이 생성되었습니다.',
        student: {
          ...student,
          mustChangePassword: true,
          temporaryPassword,
        },
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('이미 존재하는 학생 계정입니다.');
      }

      throw error;
    }
  }

  async updateStudent(id: string, body: Record<string, unknown>) {
    const data = {
      name: parseOptionalRequiredText(body.name, '이름'),
      phone: parseOptionalPhone(body.phone),
      school: parseOptionalSchool(body.school),
      currentYear: parseOptionalYear(body.currentYear, '현재 년도'),
      currentClass: parseOptionalCurrentNumber(body.currentClass, '현재 반'),
      currentNumber: parseOptionalCurrentNumber(
        body.currentNumber,
        '현재 번호',
      ),
      majorSubject: parseOptionalMajorSubject(body.majorSubject),
    };

    assertHasChanges(data);

    try {
      const updatedStudent = await this.prisma.student.update({
        where: { studentId: id },
        data,
        select: studentSummarySelect,
      });

      return {
        ok: true,
        message: '학생 정보가 수정되었습니다.',
        student: updatedStudent,
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException('학생을 찾을 수 없습니다.');
      }
      throw error;
    }
  }

  async updateStudentStatus(id: string, body: Record<string, unknown>) {
    const isActive = parseBoolean(body.isActive);

    try {
      await this.prisma.$transaction([
        this.prisma.student.update({
          where: { studentId: id },
          data: { isActive },
        }),
        ...(isActive
          ? []
          : [
              this.prisma.authSession.updateMany({
                where: { accountId: id, role: 'STUDENT', revokedAt: null },
                data: { revokedAt: new Date() },
              }),
            ]),
      ]);
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException('학생을 찾을 수 없습니다.');
      }
      throw error;
    }

    return {
      ok: true,
      message: isActive
        ? '학생 계정이 활성화되었습니다.'
        : '학생 계정이 비활성화되었습니다.',
      isActive,
    };
  }

  async getTeachers(query: Record<string, unknown> = {}) {
    const search = readOptionalSearch(query.search);
    const isActive = readOptionalBoolean(query.isActive);

    const teachers = await this.prisma.teacher.findMany({
      where: {
        isActive,
        OR: search
          ? [
              { teacherId: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: teacherSummarySelect,
    });

    return { teachers };
  }

  async getTeacher(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { teacherId: id },
      select: teacherSummarySelect,
    });

    if (!teacher) {
      throw new NotFoundException('교사를 찾을 수 없습니다.');
    }

    return { teacher };
  }

  async updateTeacher(id: string, body: Record<string, unknown>) {
    const data = {
      name: parseOptionalRequiredText(body.name, '이름'),
      phone: parseOptionalPhone(body.phone),
      isDormTeacher:
        body.isDormTeacher === undefined
          ? undefined
          : parseBoolean(body.isDormTeacher),
    };

    assertHasChanges(data);

    try {
      const updatedTeacher = await this.prisma.teacher.update({
        where: { teacherId: id },
        data,
        select: teacherSummarySelect,
      });

      return {
        ok: true,
        message: '교사 정보가 수정되었습니다.',
        teacher: updatedTeacher,
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException('교사를 찾을 수 없습니다.');
      }
      throw error;
    }
  }

  async updateTeacherDormAccess(id: string, body: Record<string, unknown>) {
    return this.updateTeacher(id, body);
  }

  async updateTeacherStatus(id: string, body: Record<string, unknown>) {
    const isActive = parseBoolean(body.isActive);

    try {
      await this.prisma.$transaction([
        this.prisma.teacher.update({
          where: { teacherId: id },
          data: { isActive },
        }),
        ...(isActive
          ? []
          : [
              this.prisma.authSession.updateMany({
                where: { accountId: id, role: 'TEACHER', revokedAt: null },
                data: { revokedAt: new Date() },
              }),
            ]),
      ]);
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException('교사를 찾을 수 없습니다.');
      }
      throw error;
    }

    return {
      ok: true,
      message: isActive
        ? '교사 계정이 활성화되었습니다.'
        : '교사 계정이 비활성화되었습니다.',
      isActive,
    };
  }

  async createTeacher(body: Record<string, unknown>) {
    const teacherId = parseTeacherId(body.teacherId);
    const name = parseRequiredText(body.name, '이름');
    const phone = parsePhone(body.phone);
    const temporaryPassword = generateTemporaryPassword();

    try {
      const teacher = await this.prisma.teacher.create({
        data: {
          teacherId,
          name,
          phone,
          passwordHash: hashPassword(temporaryPassword),
          mustChangePassword: true,
          isActive: true,
        },
        select: teacherSummarySelect,
      });

      return {
        message: '교사 계정이 생성되었습니다.',
        teacher: {
          ...teacher,
          mustChangePassword: true,
          temporaryPassword,
        },
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('이미 사용 중인 교사 아이디입니다.');
      }

      throw error;
    }
  }

}

const studentSummarySelect = {
  studentId: true,
  school: true,
  currentYear: true,
  currentClass: true,
  currentNumber: true,
  majorSubject: true,
  name: true,
  phone: true,
  isActive: true,
} as const;

const teacherSummarySelect = {
  teacherId: true,
  name: true,
  phone: true,
  isDormTeacher: true,
  isActive: true,
} as const;

function readOptionalSearch(value: unknown) {
  const search =
    typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : undefined;

  return search;
}

function readOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parseBoolean(value);
}

function assertHasChanges(data: Record<string, unknown>) {
  if (Object.values(data).every((value) => value === undefined)) {
    throw new BadRequestException('변경할 값을 하나 이상 입력해주세요.');
  }
}
