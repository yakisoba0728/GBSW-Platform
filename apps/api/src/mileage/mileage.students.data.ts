import { MileageScope, School } from '@prisma/client';
import { findMileageStudentsByFilters } from '../common/mileage-students-data';
import type { PrismaService } from '../prisma/prisma.service';
import { compareStudentSummary, mapStudentSummary } from './mileage.mappers';
import type { StudentFilterOptions } from './mileage.types';

export async function findStudentsByFilters(
  prisma: PrismaService,
  scope: MileageScope,
  filters: StudentFilterOptions,
) {
  return findMileageStudentsByFilters(prisma, filters, {
    fixedSchool: scope === MileageScope.DORM ? School.GBSW : undefined,
    orderBySchool: scope === MileageScope.SCHOOL,
    mapStudentSummary,
    compareStudentSummary,
  });
}
