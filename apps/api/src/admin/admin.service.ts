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
  assertTeacherIdDoesNotCollide,
  generateTemporaryPassword,
  isUniqueConstraintError,
  parseBoolean,
  parseOptionalPhone,
  parseOptionalRequiredText,
  parseRequiredText,
  parseTeacherId,
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

  async getTeachers(query: Record<string, unknown> = {}) {
    const search = readOptionalSearch(query.search);
    const normalizedPhoneSearch = search ? normalizePhoneSearch(search) : null;
    const isActive = readOptionalBoolean(query.isActive);

    const teachers = await this.prisma.teacher.findMany({
      where: {
        isActive,
        OR: search
          ? [
              { teacherId: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: normalizedPhoneSearch ?? search } },
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
    const phone = parseOptionalPhone(body.phone);
    const temporaryPassword = generateTemporaryPassword(teacherId);

    const existingStudent = await this.prisma.student.findUnique({
      where: {
        studentId: teacherId,
      },
      select: {
        studentId: true,
      },
    });

    assertTeacherIdDoesNotCollide(teacherId, {
      existingStudentId: existingStudent?.studentId ?? null,
    });

    try {
      const teacher = await this.prisma.teacher.create({
        data: {
          teacherId,
          name,
          ...(phone !== undefined ? { phone } : {}),
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

function normalizePhoneSearch(value: string) {
  const digits = value.replaceAll(/\D/g, '');

  return digits.length > 0 ? digits : null;
}

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
