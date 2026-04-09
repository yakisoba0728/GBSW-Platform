import { describe, expect, it, vi } from 'vitest';
import { MileageScope } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { MileageEntriesService } from './mileage.entries.service';

describe('MileageEntriesService', () => {
  it('rejects dorm entry scores that fall outside a one-sided rule range', async () => {
    const prisma = createPrisma({
      authSession: {
        findFirst: vi.fn().mockResolvedValue({ id: 'session-1' }),
      },
      teacher: {
        findFirst: vi.fn().mockResolvedValue({
          teacherId: 'teacher-1',
          name: '사감 교사',
          isDormTeacher: true,
        }),
      },
      student: {
        findMany: vi.fn().mockResolvedValue([{ studentId: 'GB240101' }]),
      },
      mileageRule: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 1,
            type: 'REWARD',
            minScore: 5,
            maxScore: null,
          },
        ]),
      },
      $transaction: vi.fn(),
    });

    const service = new MileageEntriesService(prisma);

    await expect(
      service.createEntries(MileageScope.DORM, 'teacher-1', 'session-1', {
        entries: [
          {
            studentId: 'GB240101',
            ruleId: 1,
            score: 3,
          },
        ],
      }),
    ).rejects.toThrow('점수는 5 이상이어야 합니다.');
  });

  it('exports entry histories without applying pagination', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = createPrisma({
      authSession: {
        findFirst: vi.fn().mockResolvedValue({ id: 'session-1' }),
      },
      teacher: {
        findFirst: vi.fn().mockResolvedValue({
          teacherId: 'teacher-1',
          name: '담당 교사',
        }),
      },
      student: {
        findMany: vi.fn().mockResolvedValue([
          {
            studentId: 'GB240101',
            name: '학생',
            school: 'GBSW',
            currentYear: 2,
            currentClass: 3,
            currentNumber: 4,
          },
        ]),
      },
      mileageEntry: {
        count: vi.fn().mockResolvedValue(1),
        findMany,
      },
    });

    const service = new MileageEntriesService(prisma);

    const result = await service.getEntriesExport(
      MileageScope.SCHOOL,
      'teacher-1',
      'session-1',
      {
        grade: '2',
        page: '5',
        pageSize: '50',
      },
    );

    expect(result).toEqual({
      items: [],
      totalCount: 0,
    });

    const call = findMany.mock.calls[0]?.[0] as {
      where: { scope: MileageScope; deletedAt: null };
      orderBy: Array<Record<string, string>>;
    };

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(call.where.scope).toBe(MileageScope.SCHOOL);
    expect(call.where.deletedAt).toBeNull();
    expect(call.orderBy).toEqual([
      { awardedAt: 'desc' },
      { createdAt: 'desc' },
    ]);
  });
});

function createPrisma(overrides: Record<string, unknown>) {
  return overrides as unknown as PrismaService;
}
