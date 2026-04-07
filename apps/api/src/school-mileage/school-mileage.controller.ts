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
import { SchoolMileageService } from './school-mileage.service';

@Controller('school-mileage')
export class SchoolMileageController {
  constructor(private readonly schoolMileageService: SchoolMileageService) {}

  @Get('rules')
  getRules(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getRules(
      actorTeacherId,
      actorSuperAdminId,
      actorSessionId,
    );
  }

  @Post('rules')
  createRule(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.createRule(
      actorSuperAdminId,
      actorSessionId,
      body,
    );
  }

  @Patch('rules/:id')
  updateRule(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.updateRule(
      actorSuperAdminId,
      actorSessionId,
      id,
      body,
    );
  }

  @Patch('rules/:id/toggle')
  toggleRule(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.toggleRule(
      actorSuperAdminId,
      actorSessionId,
      id,
    );
  }

  @Get('students')
  getStudents(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getStudents(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Get('students/:studentId/summary')
  getStudentSummary(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('studentId') studentId: string,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getStudentSummary(
      actorTeacherId,
      actorSessionId,
      studentId,
      query,
    );
  }

  @Get('analytics/overview')
  getOverviewAnalytics(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getOverviewAnalytics(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Get('analytics/students')
  getStudentAnalytics(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getStudentAnalytics(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Get('analytics/classes')
  getClassAnalytics(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getClassAnalytics(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Post('entries/batch')
  createEntries(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.createEntries(
      actorTeacherId,
      actorSessionId,
      body,
    );
  }

  @Get('entries')
  getEntries(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getEntries(
      actorTeacherId,
      actorSessionId,
      query,
    );
  }

  @Patch('entries/:id')
  updateEntry(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.updateEntry(
      actorTeacherId,
      actorSessionId,
      id,
      body,
    );
  }

  @Delete('entries/:id')
  deleteEntry(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.deleteEntry(
      actorTeacherId,
      actorSessionId,
      id,
    );
  }

  @Get('my/summary')
  getMyMileageSummary(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getMyMileageSummary(
      actorStudentId,
      actorSessionId,
    );
  }

  @Get('my/entries')
  getMyEntries(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getMyEntries(
      actorStudentId,
      actorSessionId,
      query,
    );
  }

  @Get('my/rules')
  getMyActiveRules(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getMyActiveRules(
      actorStudentId,
      actorSessionId,
    );
  }
}
