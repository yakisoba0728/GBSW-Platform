-- DropIndex
DROP INDEX "students_school_admission_year_class_number_student_number_idx";

-- AlterTable
ALTER TABLE "students"
  DROP COLUMN "admission_year",
  DROP COLUMN "class_number",
  DROP COLUMN "student_number";
