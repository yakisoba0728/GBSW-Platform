import { Injectable } from '@nestjs/common';
import { MileageServiceBase } from '../common/mileage-facade';
import { DormMileageAnalyticsService } from './dorm-mileage.analytics.service';
import { DormMileageEntriesService } from './dorm-mileage.entries.service';
import { DormMileageRulesService } from './dorm-mileage.rules.service';
import { DormMileageStudentsService } from './dorm-mileage.students.service';

@Injectable()
export class DormMileageService extends MileageServiceBase<
  DormMileageRulesService,
  DormMileageStudentsService,
  DormMileageEntriesService,
  DormMileageAnalyticsService
> {
  constructor(
    rulesService: DormMileageRulesService,
    studentsService: DormMileageStudentsService,
    entriesService: DormMileageEntriesService,
    analyticsService: DormMileageAnalyticsService,
  ) {
    super(rulesService, studentsService, entriesService, analyticsService);
  }

  getMyDormAccess(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    return this.studentsService.getMyDormAccess(actorTeacherId, actorSessionId);
  }
}
