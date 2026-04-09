import { ForbiddenException } from '@nestjs/common';
import { MileageScope } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { MileageStudentsService } from './mileage.students.service';

describe('MileageStudentsService.getStudentSummary', () => {
  it('throws ForbiddenException when a non-dorm teacher accesses the dorm scope', async () => {
    // A teacher who exists and has a valid session but is NOT a dorm teacher.
    // assertTeacherExists selects { teacherId, name }
    // assertTeacherReadAccess then selects { isDormTeacher } — returns null to simulate
    // a teacher record where isDormTeacher is false (or the record is missing entirely).
    let teacherFindFirstCallCount = 0;
    const prisma = {
      authSession: {
        findFirst: () => Promise.resolve({ id: 'session-1' }),
      },
      teacher: {
        findFirst: () => {
          teacherFindFirstCallCount += 1;
          if (teacherFindFirstCallCount === 1) {
            // First call: assertTeacherExists checks teacher is active
            return Promise.resolve({ teacherId: 'teacher-1', name: '담당 교사' });
          }
          // Second call: assertTeacherReadAccess checks isDormTeacher — teacher is not a dorm teacher
          return Promise.resolve({ teacherId: 'teacher-1', name: '담당 교사', isDormTeacher: false });
        },
      },
    } as unknown as PrismaService;

    const service = new MileageStudentsService(prisma);

    await expect(
      service.getStudentSummary(
        MileageScope.DORM,
        'teacher-1',
        'session-1',
        'student-1',
        {},
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
