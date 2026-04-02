import type { PrismaService } from '../prisma/prisma.service';
import {
  compareStudentSummary,
  mapStudentSummary,
} from './school-mileage.mappers';
import type { StudentFilterOptions } from './school-mileage.types';

export async function findStudentsByFilters(
  prisma: PrismaService,
  filters: StudentFilterOptions,
) {
  const students = await prisma.student.findMany({
    where: {
      school: filters.school ?? undefined,
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
      { school: 'asc' },
      { currentClass: 'asc' },
      { currentNumber: 'asc' },
      { name: 'asc' },
    ],
    select: {
      studentId: true,
      name: true,
      school: true,
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
