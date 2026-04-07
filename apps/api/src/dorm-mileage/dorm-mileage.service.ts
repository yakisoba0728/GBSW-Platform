import { Injectable } from '@nestjs/common';
import { DormMileageAnalyticsService } from './dorm-mileage.analytics.service';
import { DormMileageEntriesService } from './dorm-mileage.entries.service';
import { DormMileageRulesService } from './dorm-mileage.rules.service';
import { DormMileageStudentsService } from './dorm-mileage.students.service';

@Injectable()
export class DormMileageService {
  constructor(
    private readonly rulesService: DormMileageRulesService,
    private readonly studentsService: DormMileageStudentsService,
    private readonly entriesService: DormMileageEntriesService,
    private readonly analyticsService: DormMileageAnalyticsService,
  ) {}

  getRules(
    actorTeacherId: string | undefined,
    actorSuperAdminId?: string,
    actorSessionId?: string,
  ) {
    return this.rulesService.getRules(
      actorTeacherId,
      actorSuperAdminId,
      actorSessionId,
    );
  }

  createRule(
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    return this.rulesService.createRule(
      actorSuperAdminId,
      actorSessionId,
      body,
    );
  }

  updateRule(
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    return this.rulesService.updateRule(
      actorSuperAdminId,
      actorSessionId,
      id,
      body,
    );
  }

  getStudents(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.studentsService.getStudents(actorTeacherId, query);
  }

  getStudentSummary(
    actorTeacherId: string | undefined,
    studentId: string,
    query: Record<string, unknown>,
  ) {
    return this.studentsService.getStudentSummary(
      actorTeacherId,
      studentId,
      query,
    );
  }

  createEntries(
    actorTeacherId: string | undefined,
    body: Record<string, unknown>,
  ) {
    return this.entriesService.createEntries(actorTeacherId, body);
  }

  getEntries(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.entriesService.getEntries(actorTeacherId, query);
  }

  updateEntry(
    actorTeacherId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    return this.entriesService.updateEntry(actorTeacherId, id, body);
  }

  deleteEntry(actorTeacherId: string | undefined, id: string) {
    return this.entriesService.deleteEntry(actorTeacherId, id);
  }

  getOverviewAnalytics(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getOverview(actorTeacherId, query);
  }

  getStudentAnalytics(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getStudentAnalytics(actorTeacherId, query);
  }

  getClassAnalytics(
    actorTeacherId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getClassAnalytics(actorTeacherId, query);
  }

  getMyDormAccess(actorTeacherId: string | undefined) {
    return this.studentsService.getMyDormAccess(actorTeacherId);
  }

  getMyMileageSummary(actorStudentId: string | undefined) {
    return this.studentsService.getMyMileageSummary(actorStudentId);
  }

  getMyEntries(
    actorStudentId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.entriesService.getMyEntries(actorStudentId, query);
  }

  getMyActiveRules(actorStudentId: string | undefined) {
    return this.rulesService.getActiveRules(actorStudentId);
  }
}
