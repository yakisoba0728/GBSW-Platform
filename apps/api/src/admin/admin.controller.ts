import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { assertInternalSuperAdmin } from './admin-auth';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('students/major-subjects')
  getStudentMajorSubjects(
    @Headers('x-super-admin-id') adminId: string | undefined,
    @Headers('x-super-admin-password') adminPassword: string | undefined,
  ) {
    assertInternalSuperAdmin(adminId, adminPassword);

    return this.adminService.getStudentMajorSubjects();
  }

  @Post('students')
  createStudent(
    @Headers('x-super-admin-id') adminId: string | undefined,
    @Headers('x-super-admin-password') adminPassword: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalSuperAdmin(adminId, adminPassword);

    return this.adminService.createStudent(body);
  }

  @Post('teachers')
  createTeacher(
    @Headers('x-super-admin-id') adminId: string | undefined,
    @Headers('x-super-admin-password') adminPassword: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalSuperAdmin(adminId, adminPassword);

    return this.adminService.createTeacher(body);
  }
}
