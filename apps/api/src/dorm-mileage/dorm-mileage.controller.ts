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

  @Get('students')
  getStudents(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getStudents(actorTeacherId, query);
  }

  @Get('students/:studentId/summary')
  getStudentSummary(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Param('studentId') studentId: string,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getStudentSummary(
      actorTeacherId,
      studentId,
      query,
    );
  }

  @Get('analytics/overview')
  getOverviewAnalytics(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getOverviewAnalytics(actorTeacherId, query);
  }

  @Get('analytics/students')
  getStudentAnalytics(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getStudentAnalytics(actorTeacherId, query);
  }

  @Get('analytics/classes')
  getClassAnalytics(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getClassAnalytics(actorTeacherId, query);
  }

  @Post('entries/batch')
  createEntries(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.createEntries(actorTeacherId, body);
  }

  @Get('entries')
  getEntries(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getEntries(actorTeacherId, query);
  }

  @Patch('entries/:id')
  updateEntry(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.updateEntry(actorTeacherId, id, body);
  }

  @Delete('entries/:id')
  deleteEntry(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Param('id') id: string,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.deleteEntry(actorTeacherId, id);
  }

  @Get('my/access')
  getMyDormAccess(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getMyDormAccess(actorTeacherId);
  }

  @Get('my/summary')
  getMyMileageSummary(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getMyMileageSummary(actorStudentId);
  }

  @Get('my/entries')
  getMyEntries(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getMyEntries(actorStudentId, query);
  }

  @Get('my/rules')
  getMyActiveRules(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-student-id') actorStudentId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.dormMileageService.getMyActiveRules(actorStudentId);
  }
}
