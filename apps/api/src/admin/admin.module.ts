import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DbService } from './db.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, DbService],
})
export class AdminModule {}
