-- ============================================================
-- Migration: Unify School/Dorm Mileage into single tables
-- ============================================================

-- Step 1: Create new enums
CREATE TYPE "MileageScope" AS ENUM ('SCHOOL', 'DORM');
CREATE TYPE "MileageType" AS ENUM ('REWARD', 'PENALTY');

-- Step 2: Create unified mileage_rules table
CREATE TABLE "mileage_rules" (
    "id" SERIAL NOT NULL,
    "scope" "MileageScope" NOT NULL,
    "type" "MileageType" NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_score" INTEGER NOT NULL,
    "min_score" INTEGER,
    "max_score" INTEGER,
    "display_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mileage_rules_pkey" PRIMARY KEY ("id")
);

-- Step 3: Migrate school rules (preserve original IDs)
INSERT INTO "mileage_rules" ("id", "scope", "type", "category", "name", "default_score", "min_score", "max_score", "display_order", "is_active", "created_at", "updated_at")
SELECT "id", 'SCHOOL'::"MileageScope", "type"::text::"MileageType", "category", "name", "default_score", NULL, NULL, "display_order", "is_active", "created_at", "updated_at"
FROM "school_mileage_rules";

-- Step 4: Migrate dorm rules (offset IDs to avoid collision)
DO $$
DECLARE
    max_school_id INTEGER;
BEGIN
    SELECT COALESCE(MAX("id"), 0) INTO max_school_id FROM "school_mileage_rules";

    INSERT INTO "mileage_rules" ("id", "scope", "type", "category", "name", "default_score", "min_score", "max_score", "display_order", "is_active", "created_at", "updated_at")
    SELECT "id" + max_school_id, 'DORM'::"MileageScope", "type"::text::"MileageType", "category", "name", "default_score", "min_score", "max_score", "display_order", "is_active", "created_at", "updated_at"
    FROM "dorm_mileage_rules";

    PERFORM setval(pg_get_serial_sequence('mileage_rules', 'id'),
        GREATEST(
            (SELECT COALESCE(MAX("id"), 0) FROM "mileage_rules"),
            1
        )
    );
END $$;

-- Step 5: Create unified mileage_entries table
CREATE TABLE "mileage_entries" (
    "id" SERIAL NOT NULL,
    "scope" "MileageScope" NOT NULL,
    "student_id" TEXT NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "type" "MileageType" NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" TEXT,
    "awarded_at" TIMESTAMP(3) NOT NULL,
    "created_by_teacher_id" TEXT NOT NULL,
    "updated_by_teacher_id" TEXT,
    "deleted_by_teacher_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "mileage_entries_pkey" PRIMARY KEY ("id")
);

-- Step 6: Migrate school entries (rule IDs unchanged since school rules kept original IDs)
INSERT INTO "mileage_entries" ("id", "scope", "student_id", "rule_id", "type", "score", "reason", "awarded_at", "created_by_teacher_id", "updated_by_teacher_id", "deleted_by_teacher_id", "created_at", "updated_at", "deleted_at")
SELECT "id", 'SCHOOL'::"MileageScope", "student_id", "rule_id", "type"::text::"MileageType", "score", "reason", "awarded_at", "created_by_teacher_id", "updated_by_teacher_id", "deleted_by_teacher_id", "created_at", "updated_at", "deleted_at"
FROM "school_mileage_entries";

-- Step 7: Migrate dorm entries (offset both entry IDs and rule IDs)
DO $$
DECLARE
    max_school_rule_id INTEGER;
    max_school_entry_id INTEGER;
BEGIN
    SELECT COALESCE(MAX("id"), 0) INTO max_school_rule_id FROM "school_mileage_rules";
    SELECT COALESCE(MAX("id"), 0) INTO max_school_entry_id FROM "school_mileage_entries";

    INSERT INTO "mileage_entries" ("id", "scope", "student_id", "rule_id", "type", "score", "reason", "awarded_at", "created_by_teacher_id", "updated_by_teacher_id", "deleted_by_teacher_id", "created_at", "updated_at", "deleted_at")
    SELECT "id" + max_school_entry_id, 'DORM'::"MileageScope", "student_id", "rule_id" + max_school_rule_id, "type"::text::"MileageType", "score", "reason", "awarded_at", "created_by_teacher_id", "updated_by_teacher_id", "deleted_by_teacher_id", "created_at", "updated_at", "deleted_at"
    FROM "dorm_mileage_entries";

    PERFORM setval(pg_get_serial_sequence('mileage_entries', 'id'),
        GREATEST(
            (SELECT COALESCE(MAX("id"), 0) FROM "mileage_entries"),
            1
        )
    );
END $$;

-- Step 8: Add indexes
CREATE UNIQUE INDEX "mileage_rules_scope_type_category_name_key" ON "mileage_rules"("scope", "type", "category", "name");
CREATE UNIQUE INDEX "mileage_rules_scope_display_order_key" ON "mileage_rules"("scope", "display_order");
CREATE INDEX "mileage_rules_scope_is_active_display_order_idx" ON "mileage_rules"("scope", "is_active", "display_order");

CREATE INDEX "mileage_entries_scope_student_id_deleted_at_awarded_at_idx" ON "mileage_entries"("scope", "student_id", "deleted_at", "awarded_at");
CREATE INDEX "mileage_entries_scope_type_deleted_at_awarded_at_idx" ON "mileage_entries"("scope", "type", "deleted_at", "awarded_at");
CREATE INDEX "mileage_entries_scope_deleted_at_awarded_at_idx" ON "mileage_entries"("scope", "deleted_at", "awarded_at");

-- Step 9: Add foreign keys
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "mileage_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_created_by_teacher_id_fkey" FOREIGN KEY ("created_by_teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_updated_by_teacher_id_fkey" FOREIGN KEY ("updated_by_teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_deleted_by_teacher_id_fkey" FOREIGN KEY ("deleted_by_teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 10: Drop old tables (CASCADE removes their foreign keys and indexes)
DROP TABLE "school_mileage_entries" CASCADE;
DROP TABLE "dorm_mileage_entries" CASCADE;
DROP TABLE "school_mileage_rules" CASCADE;
DROP TABLE "dorm_mileage_rules" CASCADE;

-- Step 11: Drop old enums
DROP TYPE "SchoolMileageType";
DROP TYPE "DormMileageType";

-- Step 12: Add missing index to login_throttles
CREATE INDEX "login_throttles_locked_until_idx" ON "login_throttles"("locked_until");
