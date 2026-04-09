import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { assertInternalApiRequest } from '../common/internal-api-auth';
import { MileageService } from './mileage.service';
import { parseScopeParam } from './mileage.parsers';

@Controller(':scope(school-mileage|dorm-mileage)')
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Get('rules')
  getRules(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getRules(
      scope,
      actorTeacherId,
      actorSuperAdminId,
      actorSessionId,
    );
  }

  @Post('rules')
  createRule(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.createRule(
      scope,
      actorSuperAdminId,
      actorSessionId,
      body,
    );
  }

  @Patch('rules/:id')
  updateRule(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.updateRule(
      scope,
      actorSuperAdminId,
      actorSessionId,
      id,
      body,
    );
  }

  @Patch('rules/:id/toggle')
  toggleRule(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.toggleRule(
      scope,
      actorSuperAdminId,
      actorSessionId,
      id,
    );
  }

  @Get('students')
  getStudents(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getStudents(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Get('students/:studentId/summary')
  getStudentSummary(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('studentId') studentId: string,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getStudentSummary(
      scope,
      actorTeacherId,
      actorSessionId,
      studentId,
      query,
    );
  }

  @Get('analytics/overview')
  getOverviewAnalytics(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getOverviewAnalytics(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Get('analytics/export')
  getAnalyticsExport(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getAnalyticsExport(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Get('analytics/students')
  getStudentAnalytics(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getStudentAnalytics(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Get('analytics/classes')
  getClassAnalytics(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getClassAnalytics(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Post('entries/batch')
  createEntries(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.createEntries(
      scope,
      actorTeacherId,
      actorSessionId,
      body,
    );
  }

  @Get('entries')
  getEntries(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getEntries(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Get('entries/export')
  getEntriesExport(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getEntriesExport(
      scope,
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Patch('entries/:id')
  updateEntry(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.updateEntry(
      scope,
      actorTeacherId,
      actorSessionId,
      id,
      body,
    );
  }

  @Delete('entries/:id')
  deleteEntry(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.deleteEntry(
      scope,
      actorTeacherId,
      actorSessionId,
      id,
    );
  }

  @Get('my/access')
  getMyDormAccess(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);
    // This endpoint only makes sense for dorm scope, but we allow it for both
    // to avoid breaking any potential callers
    parseScopeParam(scopeParam);

    return this.mileageService.getMyDormAccess(actorTeacherId, actorSessionId);
  }

  @Get('my/summary')
  getMyMileageSummary(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getMyMileageSummary(
      scope,
      actorStudentId,
      actorSessionId,
      query,
    );
  }

  @Get('my/entries')
  getMyEntries(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getMyEntries(
      scope,
      actorStudentId,
      actorSessionId,
      query,
    );
  }

  @Get('my/entries/export')
  getMyEntriesExport(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getMyEntriesExport(
      scope,
      actorStudentId,
      actorSessionId,
      query,
    );
  }

  @Get('my/stats')
  getMyMileageStats(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getMyMileageStats(
      scope,
      actorStudentId,
      actorSessionId,
      query,
    );
  }

  @Get('my/rules')
  getMyActiveRules(
    @Param('scope') scopeParam: string,
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);
    const scope = parseScopeParam(scopeParam);

    return this.mileageService.getMyActiveRules(
      scope,
      actorStudentId,
      actorSessionId,
    );
  }
}
