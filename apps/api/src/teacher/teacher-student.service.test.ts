import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { TeacherStudentService } from './teacher-student.service';

function createService(overrides: Partial<PrismaService> = {}) {
  return new TeacherStudentService(overrides as PrismaService);
}

describe('TeacherStudentService.createStudent', () => {
  it('generates studentId from current year and creates student with studentId as password', async () => {
    const createFn = vi.fn().mockResolvedValue({
      studentId: `GB${new Date().getFullYear().toString().slice(-2)}0101`,
      school: 'GBSW',
      currentYear: 1,
      currentClass: 1,
      currentNumber: 1,
      majorSubject: null,
      name: null,
      phone: null,
      email: null,
      hasLinkedPhone: false,
      hasLinkedEmail: false,
      isActive: true,
    });
    const service = createService({
      student: { create: createFn } as any,
    });

    const result = await service.createStudent({
      school: 'GBSW',
      year: 1,
      class: 1,
      number: 1,
    });

    const year2 = new Date().getFullYear().toString().slice(-2);
    expect(result.studentId).toBe(`GB${year2}0101`);
    expect(result.temporaryPassword).toBe(`GB${year2}0101`);
    const callData = createFn.mock.calls[0][0].data;
    expect(callData.mustChangePassword).toBe(true);
  });

  it('throws ConflictException when studentId already exists', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '0.0.0',
      },
    );
    const service = createService({
      student: {
        create: vi.fn().mockRejectedValue(p2002),
      } as any,
    });

    await expect(
      service.createStudent({ school: 'GBSW', year: 1, class: 1, number: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('TeacherStudentService.resetPassword', () => {
  it('sets passwordHash to hash of studentId and mustChangePassword=true', async () => {
    const updateFn = vi.fn().mockResolvedValue({});
    const revokeSessionsFn = vi.fn().mockResolvedValue({});
    const service = createService({
      student: {
        findUnique: vi.fn().mockResolvedValue({ studentId: 'GB260101' }),
        update: updateFn,
      } as any,
      authSession: {
        updateMany: revokeSessionsFn,
      } as any,
      $transaction: vi
        .fn()
        .mockImplementation((ops: any[]) => Promise.all(ops)),
    });

    const result = await service.resetPassword('GB260101');

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mustChangePassword: true }),
      }),
    );
    expect(result.newPassword).toBe('GB260101');
  });
});

describe('TeacherStudentService.getStudents', () => {
  it('normalizes legacy calendar years into grade values before returning rows', async () => {
    const service = createService({
      student: {
        findMany: vi.fn().mockResolvedValue([
          {
            studentId: 'GB250101',
            school: 'GBSW',
            currentYear: 2026,
            currentClass: 1,
            currentNumber: 1,
            majorSubject: null,
            name: '홍길동',
            phone: null,
            email: null,
            hasLinkedPhone: false,
            hasLinkedEmail: false,
            isActive: true,
          },
        ]),
      } as any,
    });

    const result = await service.getStudents({});

    expect(result.students).toEqual([
      expect.objectContaining({
        studentId: 'GB250101',
        currentYear: 2,
      }),
    ]);
    expect(result.total).toBe(1);
  });
});

describe('TeacherStudentService.deleteStudent', () => {
  it('rejects deleting students who still have mileage history', async () => {
    const service = createService({
      student: {
        findUnique: vi.fn().mockResolvedValue({ studentId: 'GB260101' }),
      } as any,
      mileageEntry: {
        count: vi.fn().mockResolvedValue(1),
      } as any,
    });

    await expect(service.deleteStudent('GB260101')).rejects.toThrow(
      '상벌점 기록이 있는 학생은 삭제할 수 없습니다. 계정을 비활성화해주세요.',
    );
  });
});
