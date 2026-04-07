import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthCleanupService } from './auth-cleanup.service';
import { AuthService } from './auth.service';
import { SuperAdminBootstrapService } from './super-admin-bootstrap.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthCleanupService, SuperAdminBootstrapService],
})
export class AuthModule {}
