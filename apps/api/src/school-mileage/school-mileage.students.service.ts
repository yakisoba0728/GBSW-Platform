import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertStudentExists,
  assertTeacherExists,
} from './school-mileage.access';
import {
  buildStudentMileageSummary,
  mapStudentSummary,
} from './school-mileage.mappers';
import {
  parseAnalyticsFilters,
  parseStudentFilters,
} from './school-mileage.parsers';
import { findStudentsByFilters } from './school-mileage.students.data';

@Injectable()
export class SchoolMileageStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudents(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    await assertTeacherExists(this.prisma, actorTeacherId);

    const students = await findStudentsByFilters(
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
    await assertTeacherExists(this.prisma, actorTeacherId);

    const [student] = await findStudentsByFilters(this.prisma, {
      ...parseAnalyticsFilters(query),
      studentId,
    });

    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    const entries = await this.prisma.schoolMileageEntry.findMany({
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

  async getMyMileageSummary(actorStudentId: string | undefined) {
    const student = await assertStudentExists(this.prisma, actorStudentId);

    const entries = await this.prisma.schoolMileageEntry.findMany({
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
