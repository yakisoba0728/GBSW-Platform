import { describe, expect, it, vi } from 'vitest';
import { assertDormTeacherOnly } from './dorm-mileage.access';

function createPrisma({ isDormTeacher }: { isDormTeacher: boolean }) {
  return {
    authSession: {
      findFirst: vi.fn().mockResolvedValue({ id: 'session-1' }),
    },
    teacher: {
      findFirst: vi
        .fn()
        .mockResolvedValueOnce({
          teacherId: 'teacher-1',
          name: '담당 교사',
        })
        .mockResolvedValueOnce({
          teacherId: 'teacher-1',
          name: '담당 교사',
          isDormTeacher,
        }),
    },
  };
}

describe('assertDormTeacherOnly', () => {
  it('allows dorm teachers to mutate dorm mileage', async () => {
    const prisma = createPrisma({ isDormTeacher: true });

    await expect(
      assertDormTeacherOnly(prisma as never, 'teacher-1', 'session-1'),
    ).resolves.toMatchObject({
      teacherId: 'teacher-1',
      isDormTeacher: true,
    });
  });

  it('rejects non-dorm teachers from dorm mileage mutations', async () => {
    const prisma = createPrisma({ isDormTeacher: false });

    await expect(
      assertDormTeacherOnly(prisma as never, 'teacher-1', 'session-1'),
    ).rejects.toThrow('사감 교사만 기숙사 상벌점을 부여할 수 있습니다.');
  });
});
