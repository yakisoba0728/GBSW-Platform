# Layer 2: Database Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing database integrity constraints and indexes: partial unique indexes on nullable email/phone columns, a missing FK index on `mileage_entries.rule_id`, and indexes on the three audit FK columns.

**Architecture:** Each change is a separate numbered Prisma migration under `apps/api/prisma/migrations/`. The `schema.prisma` is updated to reflect the new indexes. Partial unique indexes (where column IS NOT NULL) are written as raw SQL because Prisma's `@@unique` does not support `WHERE` clauses; they are created in a manually-written migration file with a matching shadow entry in `schema.prisma` using `@@index` annotations with a comment.

**Tech Stack:** PostgreSQL 17, Prisma 6 migrations, `prisma migrate dev`

---

## File Map

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `@@index` annotations for new indexes; add raw `/// @db.UniqueIndex` comment blocks for partial uniques |
| `apps/api/prisma/migrations/20260410000000_add_partial_unique_email_phone/migration.sql` | Create |
| `apps/api/prisma/migrations/20260410000001_add_missing_fk_indexes/migration.sql` | Create |

---

### Task 1: Partial unique indexes for email and phone

**Files:**
- Create: `apps/api/prisma/migrations/20260410000000_add_partial_unique_email_phone/migration.sql`
- Modify: `apps/api/prisma/schema.prisma`

Without these indexes, two students can share the same non-null email or phone. The columns are nullable (used as optional contact info), so a regular `UNIQUE` constraint would block multiple NULLs in PostgreSQL < 15. We use a partial `UNIQUE` index (`WHERE email IS NOT NULL`) which is the standard approach and works on PG 17.

- [ ] **Step 1: Create the migration directory and SQL file**

```bash
mkdir -p apps/api/prisma/migrations/20260410000000_add_partial_unique_email_phone
```

Write `apps/api/prisma/migrations/20260410000000_add_partial_unique_email_phone/migration.sql`:

```sql
-- Partial unique indexes: enforce uniqueness only when the contact field is non-null.
-- Standard PostgreSQL approach for nullable unique columns.

CREATE UNIQUE INDEX "students_email_unique_idx"
  ON "students" ("email")
  WHERE "email" IS NOT NULL;

CREATE UNIQUE INDEX "students_phone_unique_idx"
  ON "students" ("phone")
  WHERE "phone" IS NOT NULL;

CREATE UNIQUE INDEX "teachers_email_unique_idx"
  ON "teachers" ("email")
  WHERE "email" IS NOT NULL;

CREATE UNIQUE INDEX "teachers_phone_unique_idx"
  ON "teachers" ("phone")
  WHERE "phone" IS NOT NULL;
```

- [ ] **Step 2: Apply the migration to your local dev database**

```bash
cd apps/api && npx prisma migrate dev --name add_partial_unique_email_phone
```

If the DB is not running:
```bash
cd /path/to/repo && pnpm db:up && sleep 3 && pnpm db:prepare
cd apps/api && npx prisma migrate dev --name add_partial_unique_email_phone
```

Expected output:
```
The following migration(s) have been applied:
  migrations/20260410000000_add_partial_unique_email_phone/migration.sql
```

- [ ] **Step 3: Verify the indexes were created**

```bash
cd apps/api && npx prisma db execute --stdin <<'SQL'
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('students', 'teachers')
  AND indexname LIKE '%email%unique%' OR indexname LIKE '%phone%unique%'
ORDER BY tablename, indexname;
SQL
```

Expected: 4 rows with `WHERE email IS NOT NULL` / `WHERE phone IS NOT NULL` in `indexdef`.

- [ ] **Step 4: Add `@@index` comments to `schema.prisma` for documentation**

In `apps/api/prisma/schema.prisma`, update the `Student` model — add these two lines after the `@@index([isActive])` line:

```prisma
  // Partial unique index: see migration 20260410000000 — email IS NOT NULL
  // Partial unique index: see migration 20260410000000 — phone IS NOT NULL
```

And same for `Teacher` model.

Note: Prisma cannot express partial unique indexes in the schema DSL. The raw migration manages them; comments keep the schema readable.

- [ ] **Step 5: Confirm Prisma client regenerates without errors**

```bash
cd apps/api && npx prisma generate
```
Expected: `✔ Generated Prisma Client` with no warnings about unknown indexes.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/schema.prisma \
        "apps/api/prisma/migrations/20260410000000_add_partial_unique_email_phone/migration.sql"
git commit -m "db: add partial unique indexes on student/teacher email and phone columns"
```

---

### Task 2: Add missing FK index on `mileage_entries.rule_id`

**Files:**
- Create: `apps/api/prisma/migrations/20260410000001_add_missing_fk_indexes/migration.sql`
- Modify: `apps/api/prisma/schema.prisma`

The `MileageEntry.ruleId` FK has no index. Every query joining or filtering by `rule_id` does a seq scan on `mileage_entries`. The two audit FK columns (`updated_by_teacher_id`, `deleted_by_teacher_id`) are similarly unindexed.

- [ ] **Step 1: Create the migration directory and SQL file**

```bash
mkdir -p apps/api/prisma/migrations/20260410000001_add_missing_fk_indexes
```

Write `apps/api/prisma/migrations/20260410000001_add_missing_fk_indexes/migration.sql`:

```sql
-- Missing FK indexes on mileage_entries
-- rule_id is used in JOINs and WHERE clauses; audit columns for FK integrity checks.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "mileage_entries_rule_id_idx"
  ON "mileage_entries" ("rule_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "mileage_entries_updated_by_teacher_id_idx"
  ON "mileage_entries" ("updated_by_teacher_id")
  WHERE "updated_by_teacher_id" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "mileage_entries_deleted_by_teacher_id_idx"
  ON "mileage_entries" ("deleted_by_teacher_id")
  WHERE "deleted_by_teacher_id" IS NOT NULL;
```

Note: `CREATE INDEX CONCURRENTLY` does not run inside a transaction, so Prisma's migration runner (which wraps in a transaction by default) will reject it. We need to disable that:

Add a `migration.toml` comment at the top of the SQL file telling Prisma to skip the transaction wrapper:

```sql
-- prisma-migration-statement-separator: ;
-- This migration must run outside a transaction due to CONCURRENTLY.
```

Actually the proper Prisma approach for this is to use the `--create-only` flag and manually edit to add a `DO $$ BEGIN...END $$` wrapper, or create the indexes non-concurrently. For simplicity, use non-concurrent (this is dev/migration-time, table is small):

Replace the file content with:

```sql
-- Missing FK indexes on mileage_entries

CREATE INDEX IF NOT EXISTS "mileage_entries_rule_id_idx"
  ON "mileage_entries" ("rule_id");

CREATE INDEX IF NOT EXISTS "mileage_entries_updated_by_teacher_id_idx"
  ON "mileage_entries" ("updated_by_teacher_id")
  WHERE "updated_by_teacher_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "mileage_entries_deleted_by_teacher_id_idx"
  ON "mileage_entries" ("deleted_by_teacher_id")
  WHERE "deleted_by_teacher_id" IS NOT NULL;
```

- [ ] **Step 2: Apply the migration**

```bash
cd apps/api && npx prisma migrate dev --name add_missing_fk_indexes
```

Expected:
```
The following migration(s) have been applied:
  migrations/20260410000001_add_missing_fk_indexes/migration.sql
```

- [ ] **Step 3: Verify indexes**

```bash
cd apps/api && npx prisma db execute --stdin <<'SQL'
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'mileage_entries'
  AND indexname LIKE 'mileage_entries_%_idx'
ORDER BY indexname;
SQL
```

Expected: 3 new rows for `rule_id`, `updated_by_teacher_id`, `deleted_by_teacher_id`.

- [ ] **Step 4: Update `schema.prisma` to reflect new indexes**

In the `MileageEntry` model, add these lines inside the model block after the existing `@@index` lines:

```prisma
  @@index([ruleId])
  @@index([updatedByTeacherId])
  @@index([deletedByTeacherId])
```

- [ ] **Step 5: Run `prisma generate`**

```bash
cd apps/api && npx prisma generate
```
Expected: no errors.

- [ ] **Step 6: Run API tests to confirm nothing broke**

```bash
cd apps/api && pnpm test
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma/schema.prisma \
        "apps/api/prisma/migrations/20260410000001_add_missing_fk_indexes/migration.sql"
git commit -m "db: add missing FK indexes on mileage_entries (rule_id, audit columns)"
```

---

### Final verification

- [ ] **Check Prisma migration status**

```bash
cd apps/api && npx prisma migrate status
```
Expected: `All migrations have been applied.`

- [ ] **Run full test suite**

```bash
cd /path/to/repo && pnpm test
```
Expected: all tests pass.
