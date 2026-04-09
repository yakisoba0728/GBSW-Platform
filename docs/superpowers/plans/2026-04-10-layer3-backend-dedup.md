# Layer 3: Backend Dedup & Logic Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two backend logic bugs (top/bottom student overlap, non-atomic student deactivation) and replace the abandoned `xlsx@^0.18.5` CVE library with `exceljs` in the web app.

**Architecture:** Surgical fixes only — no refactoring beyond what's needed. `buildClassMileageSummary` in `mileage-summary.ts` slices the bottom 3 from the full ranked list instead of from the remaining-after-top-3 slice. The `deactivateStudent` flow in `admin.service.ts` needs `$transaction`. The `xlsx` library is client-side in `apps/web/lib/export-utils.ts` and is replaced by `exceljs` which has active CVE maintenance.

**Tech Stack:** NestJS, Prisma, ExcelJS (replacing xlsx@0.18.5)

---

## File Map

| File | Change |
|------|--------|
| `apps/api/src/common/mileage-summary.ts` | Fix `buildClassMileageSummary` bottom slice |
| `apps/api/src/common/mileage-summary.test.ts` | Update test expectation to non-overlapping result |
| `apps/api/src/admin/admin.service.ts` | Wrap `deactivateStudent` (if exists) in `$transaction` |
| `apps/web/lib/export-utils.ts` | Rewrite using `exceljs` |
| `apps/web/package.json` | Replace `xlsx` with `exceljs` |

---

### Task 1: Fix `buildClassMileageSummary` top/bottom student overlap

**Files:**
- Modify: `apps/api/src/common/mileage-summary.ts:129-131`
- Modify: `apps/api/src/common/mileage-summary.test.ts:132-134`

**The bug:** With 4 ranked students, `slice(-3)` gives indices 1, 2, 3 — but indices 1 and 2 are already in `topStudents` (indices 0, 1, 2). The bottom slice should only draw from students *not* already in the top slice.

- [ ] **Step 1: Update the test to expect non-overlapping bottom students**

In `apps/api/src/common/mileage-summary.test.ts`, the test `'sorts students consistently inside class summaries and keeps the bottom slice'` currently expects (around line 132):

```typescript
// Current (buggy — GB240103 and GB240102 appear in both lists):
expect(
  classSummary.bottomStudents.map((student) => student.studentId),
).toEqual(['GB240104', 'GB240103', 'GB240102']);
```

Change to:
```typescript
// Fixed: bottomStudents only contains students NOT in topStudents
expect(
  classSummary.bottomStudents.map((student) => student.studentId),
).toEqual(['GB240104']);
```

- [ ] **Step 2: Run to verify the test fails (existing code doesn't match new expectation)**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 5 'bottom slice'
```
Expected: `AssertionError: expected ['GB240104', 'GB240103', 'GB240102'] to deeply equal ['GB240104']`.

- [ ] **Step 3: Fix `buildClassMileageSummary` in `mileage-summary.ts`**

Replace lines 129–131 in `apps/api/src/common/mileage-summary.ts`:

```typescript
// Before:
    topStudents: sortedByNetScore.slice(0, 3),
    bottomStudents:
      sortedByNetScore.length > 3 ? sortedByNetScore.slice(-3).reverse() : [],

// After:
    topStudents: sortedByNetScore.slice(0, 3),
    bottomStudents: sortedByNetScore.slice(3).slice(-3).reverse(),
```

Explanation: `slice(3)` removes the top-3 students; then `slice(-3)` takes at most 3 from the tail of what remains; `reverse()` puts the worst student first.

- [ ] **Step 4: Run to verify the test passes**

```bash
cd apps/api && pnpm test --reporter=verbose 2>&1 | grep -A 5 'bottom slice'
```
Expected: `✓ sorts students consistently inside class summaries and keeps the bottom slice`.

- [ ] **Step 5: Manually verify with edge cases**

Add a quick inline check — no need for extra test file, add to the same `describe` block in `mileage-summary.test.ts`:

```typescript
  it('bottomStudents never overlaps with topStudents', () => {
    // 6 students — top 3 should not appear in bottom 3
    const summaries = Array.from({ length: 6 }, (_, i) => ({
      studentId: `ST${i}`,
      name: `학생${i}`,
      grade: 1,
      classNumber: 1,
      studentNumber: i + 1,
      rewardTotal: 6 - i,
      penaltyTotal: 0,
      netScore: 6 - i,
      entryCount: 1,
    }));

    const result = buildClassMileageSummary(1, summaries);
    const topIds = new Set(result.topStudents.map((s) => s.studentId));
    const bottomIds = result.bottomStudents.map((s) => s.studentId);

    expect(bottomIds.some((id) => topIds.has(id))).toBe(false);
    expect(result.bottomStudents).toHaveLength(3);
    // Worst student first
    expect(result.bottomStudents[0].studentId).toBe('ST5');
  });
```

- [ ] **Step 6: Run all API tests**

```bash
cd apps/api && pnpm test
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/common/mileage-summary.ts apps/api/src/common/mileage-summary.test.ts
git commit -m "fix: prevent top/bottom student overlap in buildClassMileageSummary"
```

---

### Task 2: Make student deactivation atomic in AdminService

**Files:**
- Modify: `apps/api/src/admin/admin.service.ts`

The admin service's `updateTeacherStatus` already uses `$transaction` (lines 104–117). But there is no equivalent `deactivateStudent` method — student deactivation would need to be added similarly if it's missing. Let's confirm by checking the DB service.

- [ ] **Step 1: Check if student deactivation exists and whether it's atomic**

```bash
grep -n 'deactivate\|isActive\|student.*update\|update.*student' apps/api/src/admin/admin.service.ts | head -20
grep -n 'deactivate\|isActive\|student.*update\|update.*student' apps/api/src/admin/db.service.ts | head -20
```

- [ ] **Step 2: If `updateStudentStatus` exists and lacks a `$transaction`**

If `updateStudentStatus` (or equivalent) exists and only updates the student row without revoking sessions atomically, wrap it:

```typescript
async updateStudentStatus(id: string, body: Record<string, unknown>) {
  const isActive = parseBoolean(body.isActive);

  try {
    await this.prisma.$transaction([
      this.prisma.student.update({
        where: { studentId: id },
        data: { isActive },
      }),
      ...(isActive
        ? []
        : [
            this.prisma.authSession.updateMany({
              where: { accountId: id, role: 'STUDENT', revokedAt: null },
              data: { revokedAt: new Date() },
            }),
          ]),
    ]);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }
    throw error;
  }

  return {
    ok: true,
    message: isActive
      ? '학생 계정이 활성화되었습니다.'
      : '학생 계정이 비활성화되었습니다.',
    isActive,
  };
}
```

- [ ] **Step 3: Run API tests**

```bash
cd apps/api && pnpm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit (if changes were made)**

```bash
git add apps/api/src/admin/admin.service.ts
git commit -m "fix: wrap student deactivation + session revoke in $transaction"
```

---

### Task 3: Replace `xlsx@^0.18.5` with `exceljs` (CVE remediation)

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/lib/export-utils.ts`

`xlsx@^0.18.5` is abandoned and has unpatched CVEs (prototype pollution, arbitrary code execution). `exceljs` is actively maintained, supports the same `.xlsx` output format, and has a similar streaming-friendly API.

- [ ] **Step 1: Install `exceljs`, remove `xlsx`**

```bash
cd apps/web && pnpm remove xlsx && pnpm add exceljs
```

Expected: `pnpm-lock.yaml` updated, `xlsx` removed from `package.json` dependencies.

- [ ] **Step 2: Verify `xlsx` is no longer installed**

```bash
grep '"xlsx"' apps/web/package.json
```
Expected: no output.

- [ ] **Step 3: Rewrite `export-utils.ts` using ExcelJS**

Replace `apps/web/lib/export-utils.ts` entirely:

```typescript
export interface ExportColumn<T> {
  header: string
  accessor: (row: T) => string | number
  width?: number
}

export async function exportToExcel<T>({
  data,
  columns,
  filename,
  sheetName = 'Sheet1',
}: {
  data: T[]
  columns: ExportColumn<T>[]
  filename: string
  sheetName?: string
}): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  worksheet.columns = columns.map((col) => {
    const rows = data.map((row) => String(col.accessor(row) ?? ''))
    const maxDataLen = rows.reduce((max, val) => Math.max(max, val.length), 0)
    return {
      header: col.header,
      key: col.header,
      width: col.width ?? Math.max(col.header.length, maxDataLen) + 2,
    }
  })

  for (const row of data) {
    const values: Record<string, string | number> = {}
    for (const col of columns) {
      values[col.header] = col.accessor(row)
    }
    worksheet.addRow(values)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}.xlsx`
  anchor.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run web tests**

```bash
cd apps/web && pnpm test
```
Expected: all tests pass (export-utils has no unit tests; verify no TypeScript errors).

- [ ] **Step 5: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -i 'export-utils\|xlsx\|exceljs' | head -20
```
Expected: no errors related to these files.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/export-utils.ts apps/web/package.json pnpm-lock.yaml
git commit -m "security: replace abandoned xlsx@0.18.5 with exceljs (CVE remediation)"
```

---

### Final verification

- [ ] **Run full test suite**

```bash
cd /path/to/repo && pnpm test
```
Expected: all tests pass across both apps.

- [ ] **TypeScript check both apps**

```bash
cd apps/api && npx tsc --noEmit && cd ../web && npx tsc --noEmit
```
Expected: no type errors.
