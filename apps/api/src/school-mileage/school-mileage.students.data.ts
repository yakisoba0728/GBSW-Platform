import { findMileageStudentsByFilters } from '../common/mileage-students-data';
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
  return findMileageStudentsByFilters(prisma, filters, {
    orderBySchool: true,
    mapStudentSummary,
    compareStudentSummary,
  });
}
