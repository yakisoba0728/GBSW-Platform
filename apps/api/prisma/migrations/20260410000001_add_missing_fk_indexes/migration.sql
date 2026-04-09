-- Missing FK indexes on mileage_entries
-- rule_id is used in JOINs and WHERE clauses; audit columns for FK integrity checks.

CREATE INDEX IF NOT EXISTS "mileage_entries_rule_id_idx"
  ON "mileage_entries" ("rule_id");

CREATE INDEX IF NOT EXISTS "mileage_entries_updated_by_teacher_id_idx"
  ON "mileage_entries" ("updated_by_teacher_id")
  WHERE "updated_by_teacher_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "mileage_entries_deleted_by_teacher_id_idx"
  ON "mileage_entries" ("deleted_by_teacher_id")
  WHERE "deleted_by_teacher_id" IS NOT NULL;
