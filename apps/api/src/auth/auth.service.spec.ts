import { UnauthorizedException } from '@nestjs/common';
import { TeacherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { hashPassword, verifyPassword } from './password';

type PasswordUpdateData = {
  data: {
    passwordHash: string;
    mustChangePassword: boolean;
  };
};

type StudentRecord = {
  studentId: string;
  passwordHash: string;
  mustChangePassword: boolean;
};

type TeacherRecord = {
  teacherId: string;
  passwordHash: string;
  status: TeacherStatus;
  mustChangePassword: boolean;
};

type StudentUpdateArgs = {
  where: {
    studentId: string;
  };
  data: PasswordUpdateData['data'];
};

type TeacherUpdateArgs = {
  where: {
    teacherId: string;
  };
  data: PasswordUpdateData['data'];
};

type MockedPrisma = {
  student: {
    findUnique: jest.Mock<Promise<StudentRecord | null>, [unknown]>;
    update: jest.Mock<Promise<{ studentId: string }>, [StudentUpdateArgs]>;
  };
  teacher: {
    findUnique: jest.Mock<Promise<TeacherRecord | null>, [unknown]>;
    update: jest.Mock<Promise<{ teacherId: string }>, [TeacherUpdateArgs]>;
  };
};

describe('AuthService.changePassword', () => {
  let prisma: MockedPrisma;
  let service: AuthService;

  beforeEach(() => {
    const studentFindUnique = jest.fn<
      Promise<StudentRecord | null>,
      [unknown]
    >();
    const studentUpdate = jest.fn<
      Promise<{ studentId: string }>,
      [StudentUpdateArgs]
    >();
    const teacherFindUnique = jest.fn<
      Promise<TeacherRecord | null>,
      [unknown]
    >();
    const teacherUpdate = jest.fn<
      Promise<{ teacherId: string }>,
      [TeacherUpdateArgs]
    >();

    prisma = {
      student: {
        findUnique: studentFindUnique,
        update: studentUpdate,
      },
      teacher: {
        findUnique: teacherFindUnique,
        update: teacherUpdate,
      },
    };
    service = new AuthService(prisma as unknown as PrismaService);
  });

  it('allows first-login student password changes without the current password', async () => {
    prisma.student.findUnique.mockResolvedValue({
      studentId: '240101',
      passwordHash: hashPassword('temp-password-123'),
      mustChangePassword: true,
    });
    prisma.student.update.mockResolvedValue({
      studentId: '240101',
    });

    const result = await service.changePassword({
      accountId: '240101',
      role: 'student',
      newPassword: 'updated-password-123',
      allowMissingCurrentPassword: true,
    });

    expect(prisma.student.update).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.student.update.mock.calls[0]?.[0];
    if (!updateArgs) {
      throw new Error('Expected student password update arguments.');
    }
    expect(
      verifyPassword('updated-password-123', updateArgs.data.passwordHash),
    ).toBe(true);
    expect(updateArgs.data.mustChangePassword).toBe(false);
    expect(result).toEqual({
      ok: true,
      user: {
        accountId: '240101',
        role: 'student',
        mustChangePassword: false,
      },
    });
  });

  it('still requires the current password when the account is not in first-login state', async () => {
    prisma.teacher.findUnique.mockResolvedValue({
      teacherId: 'teacher01',
      passwordHash: hashPassword('current-password-123'),
      status: TeacherStatus.ACTIVE,
      mustChangePassword: false,
    });

    await expect(
      service.changePassword({
        accountId: 'teacher01',
        role: 'teacher',
        newPassword: 'updated-password-123',
        allowMissingCurrentPassword: true,
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.teacher.update).not.toHaveBeenCalled();
  });

  it('keeps the normal current-password verification flow for later changes', async () => {
    prisma.teacher.findUnique.mockResolvedValue({
      teacherId: 'teacher01',
      passwordHash: hashPassword('current-password-123'),
      status: TeacherStatus.ACTIVE,
      mustChangePassword: false,
    });
    prisma.teacher.update.mockResolvedValue({
      teacherId: 'teacher01',
    });

    await service.changePassword({
      accountId: 'teacher01',
      role: 'teacher',
      currentPassword: 'current-password-123',
      newPassword: 'updated-password-123',
    });

    expect(prisma.teacher.update).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.teacher.update.mock.calls[0]?.[0];
    if (!updateArgs) {
      throw new Error('Expected teacher password update arguments.');
    }
    expect(
      verifyPassword('updated-password-123', updateArgs.data.passwordHash),
    ).toBe(true);
    expect(updateArgs.data.mustChangePassword).toBe(false);
  });
});
