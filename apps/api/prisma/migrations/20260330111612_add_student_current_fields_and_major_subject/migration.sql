ALTER TABLE "students"
  ADD COLUMN "current_year" INTEGER,
  ADD COLUMN "current_class_number" INTEGER,
  ADD COLUMN "current_student_number" INTEGER,
  ADD COLUMN "major_subject" TEXT;

UPDATE "students"
SET
  "current_year" = "admission_year",
  "current_class_number" = "class_number",
  "current_student_number" = "student_number"
WHERE
  "current_year" IS NULL
  OR "current_class_number" IS NULL
  OR "current_student_number" IS NULL;

ALTER TABLE "students"
  ALTER COLUMN "current_year" SET NOT NULL,
  ALTER COLUMN "current_class_number" SET NOT NULL,
  ALTER COLUMN "current_student_number" SET NOT NULL;
