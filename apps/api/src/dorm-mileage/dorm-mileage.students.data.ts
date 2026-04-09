import { School } from '@prisma/client';
import { findMileageStudentsByFilters } from '../common/mileage-students-data';
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
  return findMileageStudentsByFilters(prisma, filters, {
    fixedSchool: School.GBSW,
    mapStudentSummary,
    compareStudentSummary,
  });
}
