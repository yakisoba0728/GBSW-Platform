import { School } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import {
  compareStudentSummary,
  mapStudentSummary,
} from './dorm-mileage.mappers';
import type { StudentFilterOptions } from './dorm-mileage.types';

export async function findDormStudentsByFilters(
  prisma: PrismaService,
  filters: StudentFilterOptions,
) {
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      school: School.GBSW,
      currentClass: filters.classNumber ?? undefined,
      studentId: filters.studentId ?? undefined,
      name: filters.name
        ? {
            contains: filters.name,
            mode: 'insensitive',
          }
        : undefined,
    },
    orderBy: [
      { currentClass: 'asc' },
      { currentNumber: 'asc' },
      { name: 'asc' },
    ],
    select: {
      studentId: true,
      name: true,
      currentYear: true,
      currentClass: true,
      currentNumber: true,
    },
  });

  return students
    .map(mapStudentSummary)
    .filter((student) =>
      filters.grade ? student.grade === filters.grade : true,
    )
    .sort(compareStudentSummary);
}
