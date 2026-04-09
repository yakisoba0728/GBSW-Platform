import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { assertSuperAdmin } from '../common/auth-access';
import { assertInternalApiRequest } from '../common/internal-api-auth';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('students/major-subjects')
  async getStudentMajorSubjects(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.getStudentMajorSubjects();
  }

  @Get('students')
  async getStudents(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.getStudents(query);
  }

  @Get('students/:id')
  async getStudent(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.getStudent(id);
  }

  @Post('students')
  async createStudent(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.createStudent(body);
  }

  @Patch('students/:id')
  async updateStudent(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.updateStudent(id, body);
  }

  @Patch('students/:id/status')
  async updateStudentStatus(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.updateStudentStatus(id, body);
  }

  @Patch('students/:id/deactivate')
  async deactivateStudent(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.updateStudentStatus(id, { isActive: false });
  }

  @Get('teachers')
  async getTeachers(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.getTeachers(query);
  }

  @Get('teachers/:id')
  async getTeacher(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.getTeacher(id);
  }

  @Post('teachers')
  async createTeacher(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.createTeacher(body);
  }

  @Patch('teachers/:id')
  async updateTeacher(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.updateTeacher(id, body);
  }

  @Patch('teachers/:id/status')
  async updateTeacherStatus(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.updateTeacherStatus(id, body);
  }

  @Patch('teachers/:id/deactivate')
  async deactivateTeacher(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('id') id: string,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );

    return this.adminService.updateTeacherStatus(id, { isActive: false });
  }

  private async assertSuperAdminAccess(
    internalApiSecret: string | undefined,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);
    await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
  }
}
