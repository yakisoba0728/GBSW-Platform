ALTER TABLE "students"
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "teachers"
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "students_is_active_idx"
ON "students"("is_active");

CREATE INDEX IF NOT EXISTS "teachers_is_active_idx"
ON "teachers"("is_active");
