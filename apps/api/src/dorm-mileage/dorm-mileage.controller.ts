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
import { DormMileageService } from './dorm-mileage.service';

@Controller('dorm-mileage')
export class DormMileageController {
  constructor(private readonly dormMileageService: DormMileageService) {}

  @Get('rules')
  getRules(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getRules(
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

    return this.dormMileageService.createRule(
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

    return this.dormMileageService.updateRule(
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

    return this.dormMileageService.toggleRule(
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

    return this.dormMileageService.getStudents(
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

    return this.dormMileageService.getStudentSummary(
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

    return this.dormMileageService.getOverviewAnalytics(
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

    return this.dormMileageService.getStudentAnalytics(
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

    return this.dormMileageService.getClassAnalytics(
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

    return this.dormMileageService.createEntries(
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

    return this.dormMileageService.getEntries(
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

    return this.dormMileageService.updateEntry(
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

    return this.dormMileageService.deleteEntry(
      actorTeacherId,
      actorSessionId,
      id,
    );
  }

  @Get('my/access')
  getMyDormAccess(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getMyDormAccess(
      actorTeacherId,
      actorSessionId,
    );
  }

  @Get('my/summary')
  getMyMileageSummary(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getMyMileageSummary(
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

    return this.dormMileageService.getMyEntries(
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

    return this.dormMileageService.getMyActiveRules(
      actorStudentId,
      actorSessionId,
    );
  }
}
