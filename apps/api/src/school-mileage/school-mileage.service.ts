import { Injectable } from '@nestjs/common';
import { MileageServiceBase } from '../common/mileage-facade';
import { SchoolMileageAnalyticsService } from './school-mileage.analytics.service';
import { SchoolMileageEntriesService } from './school-mileage.entries.service';
import { SchoolMileageRulesService } from './school-mileage.rules.service';
import { SchoolMileageStudentsService } from './school-mileage.students.service';

@Injectable()
export class SchoolMileageService extends MileageServiceBase<
  SchoolMileageRulesService,
  SchoolMileageStudentsService,
  SchoolMileageEntriesService,
  SchoolMileageAnalyticsService
> {
  constructor(
    rulesService: SchoolMileageRulesService,
    studentsService: SchoolMileageStudentsService,
    entriesService: SchoolMileageEntriesService,
    analyticsService: SchoolMileageAnalyticsService,
  ) {
    super(rulesService, studentsService, entriesService, analyticsService);
  }
}
