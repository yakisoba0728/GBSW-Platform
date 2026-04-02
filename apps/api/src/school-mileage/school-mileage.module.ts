import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SchoolMileageAnalyticsService } from './school-mileage.analytics.service';
import { SchoolMileageController } from './school-mileage.controller';
import { SchoolMileageEntriesService } from './school-mileage.entries.service';
import { SchoolMileageRulesService } from './school-mileage.rules.service';
import { SchoolMileageService } from './school-mileage.service';
import { SchoolMileageStudentsService } from './school-mileage.students.service';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolMileageController],
  providers: [
    SchoolMileageService,
    SchoolMileageRulesService,
    SchoolMileageStudentsService,
    SchoolMileageEntriesService,
    SchoolMileageAnalyticsService,
  ],
})
export class SchoolMileageModule {}
