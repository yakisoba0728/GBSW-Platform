type MileageRulesDelegate = {
  getRules: (
    actorTeacherId: string | undefined,
    actorSuperAdminId?: string,
    actorSessionId?: string,
  ) => unknown;
  createRule: (
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) => unknown;
  updateRule: (
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) => unknown;
  toggleRule: (
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) => unknown;
  getActiveRules: (
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) => unknown;
};

type MileageStudentsDelegate = {
  getStudents: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) => unknown;
  getStudentSummary: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    studentId: string,
    query: Record<string, unknown>,
  ) => unknown;
  getMyMileageSummary: (
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
  ) => unknown;
};

type MileageEntriesDelegate = {
  createEntries: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    body: Record<string, unknown>,
  ) => unknown;
  getEntries: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) => unknown;
  updateEntry: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) => unknown;
  deleteEntry: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    id: string,
  ) => unknown;
  getMyEntries: (
    actorStudentId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) => unknown;
};

type MileageAnalyticsDelegate = {
  getOverview: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) => unknown;
  getStudentAnalytics: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) => unknown;
  getClassAnalytics: (
    actorTeacherId: string | undefined,
    actorSessionId: string | undefined,
    query: Record<string, unknown>,
  ) => unknown;
};

export class MileageServiceBase<
  TRules extends MileageRulesDelegate,
  TStudents extends MileageStudentsDelegate,
  TEntries extends MileageEntriesDelegate,
  TAnalytics extends MileageAnalyticsDelegate,
> {
  constructor(
    protected readonly rulesService: TRules,
    protected readonly studentsService: TStudents,
    protected readonly entriesService: TEntries,
    protected readonly analyticsService: TAnalytics,
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
