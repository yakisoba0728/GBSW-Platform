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
import { assertInternalApiRequest } from '../admin/admin-auth';
import { SchoolMileageService } from './school-mileage.service';

@Controller('school-mileage')
export class SchoolMileageController {
  constructor(private readonly schoolMileageService: SchoolMileageService) {}

  @Get('rules')
  getRules(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getRules(actorTeacherId);
  }

  @Get('students')
  getStudents(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getStudents(actorTeacherId, query);
  }

  @Post('entries/batch')
  createEntries(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.createEntries(actorTeacherId, body);
  }

  @Get('entries')
  getEntries(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.getEntries(actorTeacherId, query);
  }

  @Patch('entries/:id')
  updateEntry(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.updateEntry(actorTeacherId, id, body);
  }

  @Delete('entries/:id')
  deleteEntry(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-teacher-id') actorTeacherId: string | undefined,
    @Param('id') id: string,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.schoolMileageService.deleteEntry(actorTeacherId, id);
  }
}
