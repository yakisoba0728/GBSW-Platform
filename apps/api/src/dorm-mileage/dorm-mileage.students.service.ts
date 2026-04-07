import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { School } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseRequiredTextInput } from '../common/parsers';
import {
  assertDormTeacherReadAccess,
  assertStudentExists,
} from './dorm-mileage.access';
import {
  buildStudentMileageSummary,
  mapStudentSummary,
} from './dorm-mileage.mappers';
import {
  parseAnalyticsFilters,
  parseStudentFilters,
} from './dorm-mileage.parsers';
import { findDormStudentsByFilters } from './dorm-mileage.students.data';

@Injectable()
export class DormMileageStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudents(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertDormTeacherReadAccess(this.prisma, actorTeacherId);

    const students = await findDormStudentsByFilters(
      this.prisma,
      parseStudentFilters(query),
    );

    return { students };
  }

  async getStudentSummary(
    actorTeacherId: string | undefined,
    studentId: string,
    query: Record<string, unknown>,
  ) {
    await assertDormTeacherReadAccess(this.prisma, actorTeacherId);

    const [student] = await findDormStudentsByFilters(this.prisma, {
      ...parseAnalyticsFilters(query),
      studentId,
    });

    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    const entries = await this.prisma.dormMileageEntry.findMany({
      where: {
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

  async getMyDormAccess(actorTeacherId: string | undefined) {
    const teacherId = parseRequiredTextInput(
      actorTeacherId,
      '교사 계정 정보가 올바르지 않습니다.',
    );
    const teacher = await this.prisma.teacher.findUnique({
      where: { teacherId },
      select: { isDormTeacher: true },
    });

    if (!teacher) {
      throw new UnauthorizedException('유효한 교사 계정이 아닙니다.');
    }

    return { isDormTeacher: teacher.isDormTeacher };
  }

  async getMyMileageSummary(actorStudentId: string | undefined) {
    const student = await assertStudentExists(this.prisma, actorStudentId);

    if (student.school !== School.GBSW) {
      return {
        summary: buildStudentMileageSummary(mapStudentSummary(student), []),
      };
    }

    const entries = await this.prisma.dormMileageEntry.findMany({
      where: {
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
