import { Injectable, NotFoundException } from '@nestjs/common';
import { MileageScope, School } from '@prisma/client';
import {
  assertTeacherExists,
  assertTeacherReadAccess,
  assertStudentExists,
} from '../common/auth-access';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildStudentMileageSummary,
  mapStudentSummary,
} from './mileage.mappers';
import {
  parseAnalyticsFilters,
  parseStudentFilters,
} from './mileage.parsers';
import { findStudentsByFilters } from './mileage.students.data';

@Injectable()
export class MileageStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudents(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId, actorSessionId);

    const students = await findStudentsByFilters(
      this.prisma,
      scope,
      parseStudentFilters(scope, query),
    );

    return { students };
  }

  async getStudentSummary(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    studentId: string,
    query: Record<string, unknown>,
  ) {
    await assertTeacherReadAccess(this.prisma, scope, actorTeacherId, actorSessionId);

    const [student] = await findStudentsByFilters(this.prisma, scope, {
      ...parseAnalyticsFilters(scope, query),
      studentId,
    });

    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    const entries = await this.prisma.mileageEntry.findMany({
      where: {
        scope,
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
    const teacher = await assertTeacherExists(
      this.prisma,
      actorTeacherId,
      actorSessionId,
    );

    const dormTeacher = await this.prisma.teacher.findFirst({
      where: {
        teacherId: teacher.teacherId,
        isActive: true,
      },
      select: { isDormTeacher: true },
    });

    return { isDormTeacher: dormTeacher?.isDormTeacher === true };
  }

  async getMyMileageSummary(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    const student = await assertStudentExists(
      this.prisma,
      actorStudentId,
      actorSessionId,
    );

    if (scope === MileageScope.DORM && student.school !== School.GBSW) {
      return {
        summary: buildStudentMileageSummary(mapStudentSummary(student), []),
      };
    }

    const entries = await this.prisma.mileageEntry.findMany({
      where: {
        scope,
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
