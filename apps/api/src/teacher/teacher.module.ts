import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeacherStudentController } from './teacher-student.controller';
import { TeacherStudentService } from './teacher-student.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherStudentController],
  providers: [TeacherStudentService],
})
export class TeacherModule {}
