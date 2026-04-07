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

  toggleRule(
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) {
    return this.rulesService.toggleRule(actorSuperAdminId, actorSessionId, id);
  }

  getStudents(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.studentsService.getStudents(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getStudentSummary(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    studentId: string,
    query: Record<string, unknown>,
  ) {
    return this.studentsService.getStudentSummary(
      actorTeacherId,
      actorSessionId,
      studentId,
      query,
    );
  }

  createEntries(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    return this.entriesService.createEntries(
      actorTeacherId,
      actorSessionId,
      body,
    );
  }

  getEntries(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.entriesService.getEntries(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  updateEntry(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    return this.entriesService.updateEntry(
      actorTeacherId,
      actorSessionId,
      id,
      body,
    );
  }

  deleteEntry(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) {
    return this.entriesService.deleteEntry(actorTeacherId, actorSessionId, id);
  }

  getOverviewAnalytics(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getOverview(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getStudentAnalytics(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getStudentAnalytics(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getClassAnalytics(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getClassAnalytics(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getMyDormAccess(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    return this.studentsService.getMyDormAccess(actorTeacherId, actorSessionId);
  }

  getMyMileageSummary(
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    return this.studentsService.getMyMileageSummary(
      actorStudentId,
      actorSessionId,
    );
  }

  getMyEntries(
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.entriesService.getMyEntries(
      actorStudentId,
      actorSessionId,
      query,
    );
  }

  getMyActiveRules(
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    return this.rulesService.getActiveRules(actorStudentId, actorSessionId);
  }
}
