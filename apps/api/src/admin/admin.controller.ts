import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { assertInternalApiRequest } from '../common/internal-api-auth';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('students/major-subjects')
  getStudentMajorSubjects(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.adminService.getStudentMajorSubjects();
  }

  @Post('students')
  createStudent(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.adminService.createStudent(body);
  }

  @Post('teachers')
  createTeacher(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.adminService.createTeacher(body);
  }
}
