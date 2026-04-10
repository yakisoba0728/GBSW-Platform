import { Injectable } from '@nestjs/common';
import { MileageScope } from '@prisma/client';
import { MileageAnalyticsService } from './mileage.analytics.service';
import { MileageEntriesService } from './mileage.entries.service';
import { MileageRulesService } from './mileage.rules.service';
import { MileageStudentsService } from './mileage.students.service';

@Injectable()
export class MileageService {
  constructor(
    private readonly rulesService: MileageRulesService,
    private readonly studentsService: MileageStudentsService,
    private readonly entriesService: MileageEntriesService,
    private readonly analyticsService: MileageAnalyticsService,
  ) {}

  getRules(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSuperAdminId?: string,
    actorSessionId?: string,
  ) {
    return this.rulesService.getRules(
      scope,
      actorTeacherId,
      actorSuperAdminId,
      actorSessionId,
    );
  }

  createRule(
    scope: MileageScope,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    return this.rulesService.createRule(
      scope,
      actorSuperAdminId,
      actorSessionId,
      body,
    );
  }

  updateRule(
    scope: MileageScope,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    return this.rulesService.updateRule(
      scope,
      actorSuperAdminId,
      actorSessionId,
      id,
      body,
    );
  }

  toggleRule(
    scope: MileageScope,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) {
    return this.rulesService.toggleRule(
      scope,
      actorSuperAdminId,
      actorSessionId,
      id,
    );
  }

  getStudents(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.studentsService.getStudents(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getStudentSummary(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    studentId: string,
    query: Record<string, unknown>,
  ) {
    return this.studentsService.getStudentSummary(
      scope,
      actorTeacherId,
      actorSessionId,
      studentId,
      query,
    );
  }

  createEntries(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) {
    return this.entriesService.createEntries(
      scope,
      actorTeacherId,
      actorSessionId,
      body,
    );
  }

  getEntries(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.entriesService.getEntries(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getEntriesExport(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.entriesService.getEntriesExport(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  updateEntry(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    return this.entriesService.updateEntry(
      scope,
      actorTeacherId,
      actorSessionId,
      id,
      body,
    );
  }

  deleteEntry(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) {
    return this.entriesService.deleteEntry(
      scope,
      actorTeacherId,
      actorSessionId,
      id,
    );
  }

  getOverviewAnalytics(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getOverview(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getStudentAnalytics(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getStudentAnalytics(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getClassAnalytics(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getClassAnalytics(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  getMyMileageSummary(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.studentsService.getMyMileageSummary(
      scope,
      actorStudentId,
      actorSessionId,
    );
  }

  getMyEntries(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.entriesService.getMyEntries(
      scope,
      actorStudentId,
      actorSessionId,
      query,
    );
  }

  getMyEntriesExport(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.entriesService.getMyEntriesExport(
      scope,
      actorStudentId,
      actorSessionId,
      query,
    );
  }

  getMyMileageStats(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.studentsService.getMyMileageStats(
      scope,
      actorStudentId,
      actorSessionId,
    );
  }

  getMyActiveRules(
    scope: MileageScope,
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    return this.rulesService.getActiveRules(
      scope,
      actorStudentId,
      actorSessionId,
    );
  }

  getMyDormAccess(
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    return this.studentsService.getMyDormAccess(actorTeacherId, actorSessionId);
  }

  getAnalyticsExport(
    scope: MileageScope,
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) {
    return this.analyticsService.getAnalyticsExport(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }
}
