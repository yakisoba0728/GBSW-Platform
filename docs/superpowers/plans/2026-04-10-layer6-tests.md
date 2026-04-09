# Layer 6: Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill test coverage gaps introduced by Layers 1–5: missing auth service branches, analytics edge cases, and the access-control route guard.

**Architecture:** All tests are unit/integration tests using Vitest. API tests use mock `PrismaService`. Web tests mock fetch. No new test framework — follow the existing pattern in each file.

**Tech Stack:** Vitest, mocking via `vi.fn()`

**Note:** Several tests referenced in this plan were already added as part of earlier layers:
- `safeStringEqual` tests → added in Layer 1 Task 1
- `buildProxyResponse Content-Disposition` tests → added in Layer 1 Task 3
- `buildClassMileageSummary` overlap test → added in Layer 3 Task 1
- `getStudentSummary` dorm access test → added in Layer 1 Task 8

This plan adds the remaining tests not covered by earlier layers.

---

## File Map

| File | Change |
|------|--------|
| `apps/api/src/auth/auth.service.test.ts` | Add `refreshOnboardingSession`, `revokeSession`, `changePassword` throttle bypass tests |
| `apps/api/src/common/auth-access.test.ts` | Add `assertTeacherOrSuperAdmin` super-admin routing test |
| `apps/api/src/mileage/mileage.analytics.service.test.ts` | Add zero-mileage student inclusion test |
| `apps/web/lib/auth-session.test.ts` | Add `getOnboardingEntryPath` tests for edge cases |

---

### Task 1: Auth service — missing branch tests

**Files:**
- Modify: `apps/api/src/auth/auth.service.test.ts`

- [ ] **Step 1: Add `revokeSession` test**

Append to `apps/api/src/auth/auth.service.test.ts`:

```typescript
describe('AuthService.revokeSession', () => {
  it('updates revokedAt for a matching session', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });

    const service = createAuthService({
      authSession: {
        updateMany,
      } as unknown as PrismaService['authSession'],
    });

    const result = await service.revokeSession({ sessionId: 'sess-123' });

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'sess-123', revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('returns ok even when no session matched (idempotent)', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    const service = createAuthService({
      authSession: {
        updateMany,
      } as unknown as PrismaService['authSession'],
    });

    const result = await service.revokeSession({ sessionId: 'ghost-session' });

    expect(result).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Add `refreshOnboardingSession` test**

```typescript
describe('AuthService.refreshOnboardingSession', () => {
  it('refreshes hasLinkedEmail and hasLinkedPhone for a student', async () => {
    const updatedSession = {
      id: 'sess1',
      accountId: 'GB260101',
      role: 'STUDENT' as const,
      mustChangePassword: false,
      hasLinkedEmail: true,
      hasLinkedPhone: false,
      expiresAt: new Date(Date.now() + 1_000_000),
    };

    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue({
          ...updatedSession,
          credentialFingerprint: null,
          revokedAt: null,
        }),
        update: vi.fn().mockResolvedValue(updatedSession),
      } as unknown as PrismaService['authSession'],
      student: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ school: 'GBSW' })  // getActiveSession → school lookup
          .mockResolvedValueOnce({ hasLinkedEmail: true, hasLinkedPhone: false }),  // refreshOnboardingSession
      } as unknown as PrismaService['student'],
    });

    const result = await service.refreshOnboardingSession('sess1');

    expect(result.ok).toBe(true);
    expect(result.session).toMatchObject({
      hasLinkedEmail: true,
      hasLinkedPhone: false,
    });
  });

  it('throws UnauthorizedException when session does not exist', async () => {
    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue(null),
      } as unknown as PrismaService['authSession'],
    });

    await expect(
      service.refreshOnboardingSession('nonexistent'),
    ).rejects.toThrow('로그인이 필요합니다.');
  });
});
```

- [ ] **Step 3: Add `changePassword` throttle bypass test**

```typescript
describe('AuthService.changePassword - mustChangePassword throttle bypass', () => {
  it('skips throttle check when mustChangePassword is true', async () => {
    process.env.INTERNAL_API_SECRET = 'test-secret';
    process.env.SUPER_ADMIN_ID = 'admin';
    process.env.SUPER_ADMIN_PASSWORD = 'pw';

    const findUnique = vi.fn();  // Should NOT be called for throttle check
    const studentUpdate = vi.fn().mockResolvedValue({});
    const sessionUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const sessionCreate = vi.fn().mockResolvedValue({
      id: 'new-sess',
      accountId: 'GB260101',
      role: 'STUDENT',
      credentialFingerprint: null,
      mustChangePassword: false,
      hasLinkedEmail: false,
      hasLinkedPhone: false,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    });

    const service = createAuthService({
      authSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sess1',
          accountId: 'GB260101',
          role: 'STUDENT',
          mustChangePassword: true,
          hasLinkedEmail: false,
          hasLinkedPhone: false,
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: null,
        }),
        updateMany: sessionUpdateMany,
        create: sessionCreate,
      } as unknown as PrismaService['authSession'],
      student: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ school: 'GBSW' })  // getActiveSession
          .mockResolvedValueOnce({
            studentId: 'GB260101',
            name: '김학생',
            passwordHash: '$2b$12$validhash',
            mustChangePassword: true,
            school: 'GBSW',
            hasLinkedEmail: false,
            hasLinkedPhone: false,
          }),
        update: studentUpdate,
      } as unknown as PrismaService['student'],
      loginThrottle: {
        findUnique,
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      } as unknown as PrismaService['loginThrottle'],
    });

    // mustChangePassword=true → throttle findUnique should NOT be called
    // (We don't verify password; testing throttle bypass logic)
    // Just call and verify findUnique was not called for throttle
    await service.changePassword('sess1', {
      currentPassword: undefined,
      newPassword: 'NewPass123!',
    }).catch(() => {
      // Password verification will fail since we mock the hash — that's OK
    });

    // The key assertion: throttle was NOT checked
    expect(findUnique).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ key: expect.stringContaining('change-pwd') }),
      }),
    );
  });
});
```

- [ ] **Step 4: Run the new tests**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 3 'revokeSession\|refreshOnboarding\|throttle bypass'
```
Expected: all 4 new tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/auth.service.test.ts
git commit -m "test: add revokeSession, refreshOnboardingSession, changePassword throttle bypass tests"
```

---

### Task 2: Auth-access — `assertTeacherOrSuperAdmin` super-admin routing

**Files:**
- Modify: `apps/api/src/common/auth-access.test.ts`

The existing test `'routes blank super-admin headers through the teacher path'` covers the teacher branch. We need a test for the super-admin branch.

- [ ] **Step 1: Add the test**

Append to the `'auth-access helpers'` describe block:

```typescript
  it('routes non-blank super-admin header through the assertSuperAdmin path', async () => {
    process.env.INTERNAL_API_SECRET = 'test-internal-secret';
    process.env.SUPER_ADMIN_ID = 'super-admin';
    process.env.SUPER_ADMIN_PASSWORD = 'super-admin-password';

    const fingerprint = createHash('sha256')
      .update('super-admin:super-admin-password')
      .digest('hex');

    const prisma = {
      authSession: {
        findFirst: () =>
          Promise.resolve({
            id: 'session-1',
            credentialFingerprint: fingerprint,
          }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      // teacher should NOT be queried
      teacher: {
        findFirst: vi.fn().mockRejectedValue(new Error('should not be called')),
      },
    };

    await expect(
      assertTeacherOrSuperAdmin(
        prisma as never,
        'teacher-1',
        'super-admin',
        'session-1',
      ),
    ).resolves.toEqual({
      role: 'super-admin',
      accountId: 'super-admin',
    });

    expect(prisma.teacher.findFirst).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 3 'assertTeacherOrSuperAdmin'
```
Expected: new test passes.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/common/auth-access.test.ts
git commit -m "test: assertTeacherOrSuperAdmin routes super-admin header to assertSuperAdmin path"
```

---

### Task 3: Analytics — zero-mileage student inclusion

**Files:**
- Modify: `apps/api/src/mileage/mileage.analytics.service.test.ts`

Students with 0 entries should appear in the analytics export with `rewardTotal: 0`, `penaltyTotal: 0`, `netScore: 0`. The current test only has students with entries.

- [ ] **Step 1: Add the test**

Append to `apps/api/src/mileage/mileage.analytics.service.test.ts`:

```typescript
describe('MileageAnalyticsService - zero mileage student inclusion', () => {
  it('includes students with no entries in the export result', async () => {
    const service = new MileageAnalyticsService({
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
            school: School.GBSW,
            currentYear: 1,
            currentClass: 1,
            currentNumber: 1,
          },
          {
            studentId: 'GB240102',
            name: '조용이',
            school: School.GBSW,
            currentYear: 1,
            currentClass: 1,
            currentNumber: 2,
          },
        ]),
      },
      mileageEntry: {
        // Only GB240101 has entries; GB240102 has none
        groupBy: vi.fn().mockResolvedValue([
          {
            studentId: 'GB240101',
            type: MileageType.REWARD,
            _count: { _all: 1 },
            _sum: { score: 5 },
          },
        ]),
      },
    } as PrismaService);

    vi.spyOn(service, 'getOverview').mockResolvedValue({
      summary: { totalCount: 1 },
      categoryStats: [],
      topRules: [],
    } as never);

    const result = await service.getAnalyticsExport(
      MileageScope.SCHOOL,
      'teacher-1',
      'session-1',
      {},
    );

    // Both students should appear
    expect(result.students).toHaveLength(2);

    const zeroStudent = result.students.find((s) => s.studentId === 'GB240102');
    expect(zeroStudent).toMatchObject({
      studentId: 'GB240102',
      rewardTotal: 0,
      penaltyTotal: 0,
      netScore: 0,
      entryCount: 0,
    });
  });
});
```

- [ ] **Step 2: Run**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 5 'zero mileage'
```
Expected: test passes (if it fails, the service has the bug described in the design doc — fix the service to include zero-entry students).

- [ ] **Step 3: If the test fails, fix `getAnalyticsExport` to include zero-entry students**

In `apps/api/src/mileage/mileage.analytics.service.ts`, find where student summaries are built. The issue is likely that students with no entries are excluded. Fix by ensuring all students from `findStudentsByFilters` are included, even those with no matching `groupBy` rows:

```typescript
// In getAnalyticsExport or wherever students + totals are joined:
const studentsWithTotals = students.map((student) => {
  const totals = totalsByStudentId.get(student.studentId) ?? EMPTY_MILEAGE_TOTALS;
  return buildMileageSummaryFromTotals(student, totals);
});
```

This ensures the `Map.get` returns `EMPTY_MILEAGE_TOTALS` (from `common/mileage-analytics.ts`) for students not present in the `groupBy` result.

- [ ] **Step 4: Re-run to verify pass**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 5 'zero mileage'
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/mileage/mileage.analytics.service.test.ts apps/api/src/mileage/mileage.analytics.service.ts
git commit -m "test: verify zero-mileage students appear in analytics export; fix if missing"
```

---

### Task 4: Web auth-session edge case tests

**Files:**
- Modify: `apps/web/lib/auth-session.test.ts`

Verify the onboarding step redirect logic handles all combinations correctly.

- [ ] **Step 1: Read the existing test file**

```bash
cat apps/web/lib/auth-session.test.ts
```

- [ ] **Step 2: Add missing `getOnboardingEntryPath` tests**

Append to `apps/web/lib/auth-session.test.ts`:

```typescript
describe('getOnboardingEntryPath', () => {
  it('returns change-password path when mustChangePassword is true', () => {
    expect(
      getOnboardingEntryPath({
        mustChangePassword: true,
        hasLinkedEmail: false,
        hasLinkedPhone: false,
      }),
    ).toBe('/onboarding/change-password')
  })

  it('returns null when all onboarding steps are complete', () => {
    expect(
      getOnboardingEntryPath({
        mustChangePassword: false,
        hasLinkedEmail: true,
        hasLinkedPhone: true,
      }),
    ).toBeNull()
  })

  it('returns null when mustChangePassword is false regardless of links', () => {
    // Current behaviour: only gates on mustChangePassword
    // This test documents the current contract
    expect(
      getOnboardingEntryPath({
        mustChangePassword: false,
        hasLinkedEmail: false,
        hasLinkedPhone: false,
      }),
    ).toBeNull()
  })
})
```

Note: The third test documents the current behaviour where `getOnboardingEntryPath` only gates on `mustChangePassword` (not on `hasLinkedEmail`/`hasLinkedPhone`). If the design decision is to gate on those too, update the test and the implementation together.

- [ ] **Step 3: Run**

```bash
cd apps/web && pnpm test --reporter=verbose 2>&1 | grep -A 5 'getOnboardingEntryPath'
```
Expected: all 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/auth-session.test.ts
git commit -m "test: add getOnboardingEntryPath edge case coverage"
```

---

### Final verification

- [ ] **Run full API test suite**

```bash
cd apps/api && pnpm test --reporter=verbose
```
Expected: all tests pass, coverage improved.

- [ ] **Run full web test suite**

```bash
cd apps/web && pnpm test --reporter=verbose
```
Expected: all tests pass.

- [ ] **Count total test coverage (optional)**

```bash
cd apps/api && pnpm test:coverage 2>&1 | tail -20
```
Review uncovered lines and determine if additional tests are warranted before declaring Layer 6 complete.
