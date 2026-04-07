import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DormMileageAnalyticsService } from './dorm-mileage.analytics.service';
import { DormMileageController } from './dorm-mileage.controller';
import { DormMileageEntriesService } from './dorm-mileage.entries.service';
import { DormMileageRulesService } from './dorm-mileage.rules.service';
import { DormMileageService } from './dorm-mileage.service';
import { DormMileageStudentsService } from './dorm-mileage.students.service';

@Module({
  imports: [PrismaModule],
  controllers: [DormMileageController],
  providers: [
    DormMileageService,
    DormMileageRulesService,
    DormMileageStudentsService,
    DormMileageEntriesService,
    DormMileageAnalyticsService,
  ],
})
export class DormMileageModule {}
