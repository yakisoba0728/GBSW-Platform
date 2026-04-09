import { describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

type StudentCreateArgs = {
  data: {
    studentId: string;
    school: string;
    currentYear: number;
    currentClass: number;
    currentNumber: number;
    phone: string;
    mustChangePassword: boolean;
    isActive: boolean;
    passwordHash: string;
  };
};

describe('AdminService.createStudent', () => {
  it('returns a one-time temporary password payload for new students', async () => {
    let createArgs: StudentCreateArgs | null = null;
    const prisma = {
      student: {
        create: (args: StudentCreateArgs) => {
          createArgs = args;

          return Promise.resolve({
            studentId: 'GB240102',
            school: 'GBSW',
            currentYear: 2024,
            currentClass: 1,
            currentNumber: 2,
            majorSubject: 'AI',
            name: '홍길동',
            phone: '01012345678',
            isActive: true,
          });
        },
      },
    } as Pick<PrismaService, 'student'>;

    const service = new AdminService(prisma as PrismaService);
    const result = await service.createStudent({
      school: 'GBSW',
      admissionYear: 2024,
      classNumber: 1,
      studentNumber: 2,
      isFirstEnrollment: true,
      majorSubject: 'AI',
      name: '홍길동',
      phone: '010-1234-5678',
    });

    expect(createArgs).not.toBeNull();

    if (createArgs === null) {
      throw new Error('student.create should be called exactly once');
    }

    const { data } = createArgs;

    expect(data.studentId).toBe('GB240102');
    expect(data.school).toBe('GBSW');
    expect(data.currentYear).toBe(2024);
    expect(data.currentClass).toBe(1);
    expect(data.currentNumber).toBe(2);
    expect(data.phone).toBe('01012345678');
    expect(data.mustChangePassword).toBe(true);
    expect(data.isActive).toBe(true);
    expect(typeof data.passwordHash).toBe('string');
    expect(result.student.mustChangePassword).toBe(true);
    expect(result.student.temporaryPassword).toMatch(/^[0-9a-f]{16}$/);
  });
});
