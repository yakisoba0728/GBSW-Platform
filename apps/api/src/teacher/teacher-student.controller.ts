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
import { assertTeacherExists } from '../common/auth-access';
import { assertInternalApiRequest } from '../common/internal-api-auth';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherStudentService } from './teacher-student.service';

@Controller('teacher/students')
export class TeacherStudentController {
  constructor(
    private readonly service: TeacherStudentService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getStudents(
    @Headers('x-internal-api-secret') secret: string | undefined,
    @Headers('x-actor-teacher-id') teacherId: string | undefined,
    @Headers('x-actor-session-id') sessionId: string | undefined,
    @Query() query: Record<string, unknown>,
  ) {
    assertInternalApiRequest(secret);
    await assertTeacherExists(this.prisma, teacherId, sessionId);
    return this.service.getStudents(query);
  }

  @Post('bulk')
  async createStudentsBulk(
    @Headers('x-internal-api-secret') secret: string | undefined,
    @Headers('x-actor-teacher-id') teacherId: string | undefined,
    @Headers('x-actor-session-id') sessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(secret);
    await assertTeacherExists(this.prisma, teacherId, sessionId);
    return this.service.createStudentsBulk(body);
  }

  @Post()
  async createStudent(
    @Headers('x-internal-api-secret') secret: string | undefined,
    @Headers('x-actor-teacher-id') teacherId: string | undefined,
    @Headers('x-actor-session-id') sessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(secret);
    await assertTeacherExists(this.prisma, teacherId, sessionId);
    return this.service.createStudent(body);
  }

  @Get(':studentId')
  async getStudent(
    @Headers('x-internal-api-secret') secret: string | undefined,
    @Headers('x-actor-teacher-id') teacherId: string | undefined,
    @Headers('x-actor-session-id') sessionId: string | undefined,
    @Param('studentId') studentId: string,
  ) {
    assertInternalApiRequest(secret);
    await assertTeacherExists(this.prisma, teacherId, sessionId);
    return this.service.getStudent(studentId);
  }

  @Patch(':studentId')
  async updateStudent(
    @Headers('x-internal-api-secret') secret: string | undefined,
    @Headers('x-actor-teacher-id') teacherId: string | undefined,
    @Headers('x-actor-session-id') sessionId: string | undefined,
    @Param('studentId') studentId: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(secret);
    await assertTeacherExists(this.prisma, teacherId, sessionId);
    return this.service.updateStudent(studentId, body);
  }

  @Delete(':studentId')
  async deleteStudent(
    @Headers('x-internal-api-secret') secret: string | undefined,
    @Headers('x-actor-teacher-id') teacherId: string | undefined,
    @Headers('x-actor-session-id') sessionId: string | undefined,
    @Param('studentId') studentId: string,
  ) {
    assertInternalApiRequest(secret);
    await assertTeacherExists(this.prisma, teacherId, sessionId);
    return this.service.deleteStudent(studentId);
  }

  @Post(':studentId/reset-password')
  async resetPassword(
    @Headers('x-internal-api-secret') secret: string | undefined,
    @Headers('x-actor-teacher-id') teacherId: string | undefined,
    @Headers('x-actor-session-id') sessionId: string | undefined,
    @Param('studentId') studentId: string,
  ) {
    assertInternalApiRequest(secret);
    await assertTeacherExists(this.prisma, teacherId, sessionId);
    return this.service.resetPassword(studentId);
  }
}
