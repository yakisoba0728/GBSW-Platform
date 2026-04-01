import { School } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from '../auth/password';
import { AdminService } from './admin.service';

type StudentCreateArgs = {
  data: {
    studentId: string;
    school: School;
    currentYear: number;
    currentClass: number;
    currentNumber: number;
    majorSubject: string;
    name: string;
    phone: string;
    passwordHash: string;
    mustChangePassword: boolean;
  };
};

type TeacherCreateArgs = {
  data: {
    teacherId: string;
    name: string;
    phone: string;
    passwordHash: string;
    mustChangePassword: boolean;
  };
};

type StudentCreateResult = {
  studentId: string;
  name: string;
  school: School;
};

type TeacherCreateResult = {
  teacherId: string;
  name: string;
};

type MockedPrisma = {
  student: {
    create: jest.Mock<Promise<StudentCreateResult>, [StudentCreateArgs]>;
  };
  teacher: {
    create: jest.Mock<Promise<TeacherCreateResult>, [TeacherCreateArgs]>;
  };
};

describe('AdminService account creation', () => {
  let prisma: MockedPrisma;
  let service: AdminService;

  beforeEach(() => {
    prisma = {
      student: {
        create: jest.fn<Promise<StudentCreateResult>, [StudentCreateArgs]>(),
      },
      teacher: {
        create: jest.fn<Promise<TeacherCreateResult>, [TeacherCreateArgs]>(),
      },
    };
    service = new AdminService(prisma as unknown as PrismaService);
  });

  it('uses student id plus the last 4 phone digits as the initial password', async () => {
    prisma.student.create.mockResolvedValue({
      studentId: 'GB260102',
      name: '홍길동',
      school: School.GBSW,
    });

    const result = await service.createStudent({
      school: School.GBSW,
      admissionYear: 2026,
      classNumber: 1,
      studentNumber: 2,
      isFirstEnrollment: true,
      majorSubject: 'Backend',
      name: '홍길동',
      phone: '010-1234-5678',
    });

    const createArgs = prisma.student.create.mock.calls[0]?.[0];
    if (!createArgs) {
      throw new Error('Expected student create arguments.');
    }

    expect(createArgs.data.studentId).toBe('GB260102');
    expect(createArgs.data.phone).toBe('01012345678');
    expect(verifyPassword('GB2601025678', createArgs.data.passwordHash)).toBe(
      true,
    );
    expect(result.student.temporaryPassword).toBe('GB2601025678');
    expect(result.student.initialPassword).toBe('GB2601025678');
  });

  it('uses teacher id plus the last 4 phone digits as the initial password', async () => {
    prisma.teacher.create.mockResolvedValue({
      teacherId: 'teacher01',
      name: '김선생',
    });

    const result = await service.createTeacher({
      teacherId: 'teacher01',
      name: '김선생',
      phone: '010-9876-5432',
    });

    const createArgs = prisma.teacher.create.mock.calls[0]?.[0];
    if (!createArgs) {
      throw new Error('Expected teacher create arguments.');
    }

    expect(createArgs.data.teacherId).toBe('teacher01');
    expect(createArgs.data.phone).toBe('01098765432');
    expect(verifyPassword('teacher015432', createArgs.data.passwordHash)).toBe(
      true,
    );
    expect(result.teacher.temporaryPassword).toBe('teacher015432');
    expect(result.teacher.initialPassword).toBe('teacher015432');
  });
});
