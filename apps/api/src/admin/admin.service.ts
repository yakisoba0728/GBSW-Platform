import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../auth/password';
import {
  buildStudentId,
  buildTemporaryPassword,
  isUniqueConstraintError,
  parseBoolean,
  parseMajorSubject,
  parsePhone,
  parsePositiveInt,
  parseRequiredText,
  parseSchool,
  parseTeacherId,
  parseYear,
  parseYearWithLabel,
} from './admin.parsers';

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
    const temporaryPassword = buildTemporaryPassword(studentId, phone);

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

  async getTeachers() {
    const teachers = await this.prisma.teacher.findMany({
      select: {
        teacherId: true,
        name: true,
        isDormTeacher: true,
      },
      orderBy: { name: 'asc' },
    });

    return { teachers };
  }

  async updateTeacherDormAccess(id: string, body: Record<string, unknown>) {
    const isDormTeacher = parseBoolean(body.isDormTeacher);

    const teacher = await this.prisma.teacher.findUnique({
      where: { teacherId: id },
      select: { teacherId: true },
    });

    if (!teacher) {
      throw new NotFoundException('교사를 찾을 수 없습니다.');
    }

    await this.prisma.teacher.update({
      where: { teacherId: id },
      data: { isDormTeacher },
    });

    return { ok: true, message: '설정이 변경되었습니다.', isDormTeacher };
  }

  async createTeacher(body: Record<string, unknown>) {
    const teacherId = parseTeacherId(body.teacherId);
    const name = parseRequiredText(body.name, '이름');
    const phone = parsePhone(body.phone);
    const temporaryPassword = buildTemporaryPassword(teacherId, phone);

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
