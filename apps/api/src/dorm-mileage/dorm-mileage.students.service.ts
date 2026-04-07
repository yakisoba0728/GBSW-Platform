import { Injectable, NotFoundException } from '@nestjs/common';
import { School } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertTeacherExists,
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
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const students = await findDormStudentsByFilters(
      this.prisma,
      parseStudentFilters(query),
    );

    return { students };
  }

  async getStudentSummary(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    studentId: string,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

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

  async getMyDormAccess(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        teacherId: (
          await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId)
        ).teacherId,
        isActive: true,
      },
      select: { isDormTeacher: true },
    });

    return { isDormTeacher: teacher?.isDormTeacher === true };
  }

  async getMyMileageSummary(
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

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
