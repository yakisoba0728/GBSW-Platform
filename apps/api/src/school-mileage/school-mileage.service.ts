import { Injectable } from '@nestjs/common';
import { SchoolMileageAnalyticsService } from './school-mileage.analytics.service';
import { SchoolMileageEntriesService } from './school-mileage.entries.service';
import { SchoolMileageRulesService } from './school-mileage.rules.service';
import { SchoolMileageStudentsService } from './school-mileage.students.service';

@Injectable()
export class SchoolMileageService {
  constructor(
    private readonly rulesService: SchoolMileageRulesService,
    private readonly studentsService: SchoolMileageStudentsService,
    private readonly entriesService: SchoolMileageEntriesService,
    private readonly analyticsService: SchoolMileageAnalyticsService,
  ) {}

  getRules(actorTeacherId: string | undefined) {
    return this.rulesService.getRules(actorTeacherId);
  }

  createRule(
    actorTeacherId: string | undefined,
    body: Record<string, unknown>,
  ) {
    return this.rulesService.createRule(actorTeacherId, body);
  }

  updateRule(
    actorTeacherId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    return this.rulesService.updateRule(actorTeacherId, id, body);
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
}
