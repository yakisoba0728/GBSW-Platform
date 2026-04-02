import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SchoolMileageController } from './school-mileage.controller';
import { SchoolMileageService } from './school-mileage.service';

@Module({
  imports: [PrismaModule],
  controllers: [SchoolMileageController],
  providers: [SchoolMileageService],
})
export class SchoolMileageModule {}
