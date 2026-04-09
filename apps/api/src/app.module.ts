import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { DormMileageModule } from './dorm-mileage/dorm-mileage.module';
import { PrismaModule } from './prisma/prisma.module';
import { SchoolMileageModule } from './school-mileage/school-mileage.module';

@Module({
  imports: [
    PrismaModule,
    AdminModule,
    AuthModule,
    SchoolMileageModule,
    DormMileageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
