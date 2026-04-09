import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MileageAnalyticsService } from './mileage.analytics.service';
import { MileageController } from './mileage.controller';
import { MileageEntriesService } from './mileage.entries.service';
import { MileageRulesService } from './mileage.rules.service';
import { MileageService } from './mileage.service';
import { MileageStudentsService } from './mileage.students.service';

@Module({
  imports: [PrismaModule],
  controllers: [MileageController],
  providers: [
    MileageService,
    MileageRulesService,
    MileageStudentsService,
    MileageEntriesService,
    MileageAnalyticsService,
  ],
})
export class MileageModule {}
