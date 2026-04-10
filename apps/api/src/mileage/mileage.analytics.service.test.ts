import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { MileageAnalyticsService } from './mileage.analytics.service';

describe('MileageAnalyticsService - zero mileage student inclusion', () => {
  it('includes students with no entries in the export result', async () => {
    const prisma = {
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
            name: '적극이',
            school: 'GBSW',
            currentYear: 1,
            currentClass: 1,
            currentNumber: 1,
          },
          {
            studentId: 'GB240102',
            name: '조용이',
            school: 'GBSW',
            currentYear: 1,
            currentClass: 1,
            currentNumber: 2,
          },
        ]),
      },
      mileageEntry: {
        groupBy: vi.fn().mockResolvedValue([
          {
            studentId: 'GB240101',
            type: 'REWARD',
            _count: { _all: 1 },
            _sum: { score: 5 },
          },
        ]),
      },
    } as unknown as PrismaService;

    const service = new MileageAnalyticsService(prisma);

    vi.spyOn(service, 'getOverview').mockResolvedValue({
      summary: { totalCount: 1 },
      categoryStats: [],
      topRules: [],
    } as never);

    const result = await service.getAnalyticsExport(
      'SCHOOL',
      'teacher-1',
      'session-1',
      {},
    );

    expect(result.students).toHaveLength(2);

    const zeroStudent = result.students.find(
      (s: { studentId: string }) => s.studentId === 'GB240102',
    );
    expect(zeroStudent).toMatchObject({
      studentId: 'GB240102',
      rewardTotal: 0,
      penaltyTotal: 0,
      netScore: 0,
      entryCount: 0,
    });
  });
});
