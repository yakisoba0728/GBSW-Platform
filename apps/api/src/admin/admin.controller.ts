import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { getSuperAdminCredentials } from '../config/runtime-env';
import { assertSuperAdmin } from '../common/auth-access';
import { assertInternalApiRequest } from '../common/internal-api-auth';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { DbService } from './db.service';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
    private readonly dbService: DbService,
  ) {}

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

  @Get('db/tables')
  async getDbTables(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );
    return this.dbService.getTables();
  }

  @Get('db/tables/:tableName')
  async getDbTableData(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('tableName') tableName: string,
    @Query() query: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );
    return this.dbService.getTableData(tableName, query);
  }

  @Patch('db/tables/:tableName/:rowId')
  async updateDbRow(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('tableName') tableName: string,
    @Param('rowId') rowId: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );
    const auditReason = this.assertDbConsoleStepUp(body);
    this.logDbAudit(
      'update-row',
      actorSuperAdminId,
      actorSessionId,
      auditReason,
      {
        tableName,
        rowId,
        column: typeof body.column === 'string' ? body.column : undefined,
      },
    );
    return this.dbService.updateRow(tableName, rowId, body);
  }

  @Delete('db/tables/:tableName/:rowId')
  async deleteDbRow(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-super-admin-id') actorSuperAdminId: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Param('tableName') tableName: string,
    @Param('rowId') rowId: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.assertSuperAdminAccess(
      internalApiSecret,
      actorSuperAdminId,
      actorSessionId,
    );
    const auditReason = this.assertDbConsoleStepUp(body);
    this.logDbAudit(
      'delete-row',
      actorSuperAdminId,
      actorSessionId,
      auditReason,
      {
        tableName,
        rowId,
      },
    );
    return this.dbService.deleteRow(tableName, rowId);
  }

  @Post('db/query')
  async executeDbQuery(
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
    const auditReason = this.assertDbConsoleStepUp(body);
    this.logDbAudit(
      'execute-query',
      actorSuperAdminId,
      actorSessionId,
      auditReason,
      {
        summary:
          typeof body.sql === 'string'
            ? body.sql.trim().replace(/\s+/g, ' ').slice(0, 160)
            : 'unknown',
      },
    );
    return this.dbService.executeQuery(body);
  }

  private async assertSuperAdminAccess(
    internalApiSecret: string | undefined,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
  ) {
    assertInternalApiRequest(internalApiSecret);
    await assertSuperAdmin(this.prisma, actorSuperAdminId, actorSessionId);
  }

  private assertDbConsoleStepUp(body: Record<string, unknown>) {
    const reauthPassword =
      typeof body.reauthPassword === 'string' ? body.reauthPassword.trim() : '';
    const auditReason =
      typeof body.auditReason === 'string' ? body.auditReason.trim() : '';
    const credentials = getSuperAdminCredentials();

    if (!reauthPassword || reauthPassword !== credentials.password) {
      throw new UnauthorizedException(
        'DB 콘솔 민감 작업을 계속하려면 최고관리자 비밀번호를 다시 확인해주세요.',
      );
    }

    if (auditReason.length < 4) {
      throw new UnauthorizedException(
        'DB 콘솔 민감 작업 사유를 4자 이상 입력해주세요.',
      );
    }

    return auditReason;
  }

  private logDbAudit(
    action: string,
    actorSuperAdminId: string | undefined,
    actorSessionId: string | undefined,
    auditReason: string,
    metadata: Record<string, unknown>,
  ) {
    this.logger.warn(
      JSON.stringify({
        action,
        actorSuperAdminId,
        actorSessionId,
        auditReason,
        metadata,
      }),
    );
  }
}
