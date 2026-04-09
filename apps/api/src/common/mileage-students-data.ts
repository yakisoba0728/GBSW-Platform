import type { School } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

type MileageStudentFilters = {
  school?: School;
  grade?: number;
  classNumber?: number;
  name?: string;
  studentId?: string;
};

type MileageStudentRecord = {
  studentId: string;
  name: string | null;
  school: School;
  currentYear: number;
  currentClass: number;
  currentNumber: number;
};

type FindMileageStudentsOptions<TSummary extends { grade: number | null }> = {
  fixedSchool?: School;
  orderBySchool?: boolean;
  mapStudentSummary: (student: MileageStudentRecord) => TSummary;
  compareStudentSummary: (left: TSummary, right: TSummary) => number;
};

export async function findMileageStudentsByFilters<
  TSummary extends { grade: number | null },
>(
  prisma: PrismaService,
  filters: MileageStudentFilters,
  {
    fixedSchool,
    orderBySchool = false,
    mapStudentSummary,
    compareStudentSummary,
  }: FindMileageStudentsOptions<TSummary>,
) {
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      school: fixedSchool ?? filters.school ?? undefined,
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
      ...(orderBySchool ? [{ school: 'asc' as const }] : []),
      { currentClass: 'asc' as const },
      { currentNumber: 'asc' as const },
      { name: 'asc' as const },
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
