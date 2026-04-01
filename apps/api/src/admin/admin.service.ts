import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, School } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../auth/password';

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
    const temporaryPassword = buildTemporaryPassword();

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
        },
      });

      return {
        message: '학생 계정이 생성되었습니다.',
        student: {
          studentId: student.studentId,
          name: student.name,
          school: student.school,
          majorSubject,
          mustChangePassword: true,
          temporaryPassword,
          initialPassword: temporaryPassword,
        },
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('이미 존재하는 학생 계정입니다.');
      }

      throw error;
    }
  }

  async createTeacher(body: Record<string, unknown>) {
    const teacherId = parseTeacherId(body.teacherId);
    const name = parseRequiredText(body.name, '이름');
    const phone = parsePhone(body.phone);
    const temporaryPassword = buildTemporaryPassword();

    try {
      const teacher = await this.prisma.teacher.create({
        data: {
          teacherId,
          name,
          phone,
          passwordHash: hashPassword(temporaryPassword),
          mustChangePassword: true,
        },
      });

      return {
        message: '교사 계정이 생성되었습니다.',
        teacher: {
          teacherId: teacher.teacherId,
          name: teacher.name,
          mustChangePassword: true,
          temporaryPassword,
          initialPassword: temporaryPassword,
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

function parseSchool(value: unknown): School {
  if (value === School.GBSW || value === School.BYMS) {
    return value;
  }

  throw new BadRequestException('학교 정보가 올바르지 않습니다.');
}

function parseYear(value: unknown) {
  return parseYearWithLabel(value, '입학년도');
}

function parseYearWithLabel(value: unknown, label: string) {
  const year = parsePositiveInt(value, label, 2000, 2099);

  if (`${year}`.length !== 4) {
    throw new BadRequestException(`${label}는 4자리로 입력해주세요.`);
  }

  return year;
}

function parsePositiveInt(
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
    throw new BadRequestException(`${label}을 입력해주세요.`);
  }

  return text;
}

function parsePhone(value: unknown) {
  const phone = toInputText(value);
  const digits = extractPhoneDigits(phone);

  if (!/^010\d{8}$/.test(digits)) {
    throw new BadRequestException(
      '전화번호는 010-0000-0000 형식으로 입력해주세요.',
    );
  }

  return digits;
}

function parseTeacherId(value: unknown) {
  const teacherId = toInputText(value);

  if (!teacherId) {
    throw new BadRequestException('교사 아이디를 입력해주세요.');
  }

  if (!/^[A-Za-z0-9._-]{4,30}$/.test(teacherId)) {
    throw new BadRequestException(
      '교사 아이디는 4~30자의 영문, 숫자, ., _, - 만 사용할 수 있습니다.',
    );
  }

  return teacherId;
}

function parseMajorSubject(value: unknown) {
  const majorSubject = toInputText(value);

  if (!majorSubject) {
    throw new BadRequestException('전공과목을 입력하거나 선택해주세요.');
  }

  return majorSubject;
}

function buildStudentId(
  school: School,
  admissionYear: number,
  classNumber: number,
  studentNumber: number,
) {
  const prefix = school === School.GBSW ? 'GB' : 'BY';
  const year = `${admissionYear}`.slice(-2);

  return `${prefix}${year}${pad(classNumber)}${pad(studentNumber)}`;
}

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

function toInputText(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return `${value}`;
  }

  return '';
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true';
  }

  return false;
}

function buildTemporaryPassword() {
  return randomBytes(12).toString('base64url');
}

function extractPhoneDigits(phone: string) {
  return phone.replaceAll(/\D/g, '');
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
