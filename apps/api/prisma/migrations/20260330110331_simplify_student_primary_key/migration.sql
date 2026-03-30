-- DropIndex
DROP INDEX "students_student_id_key";

-- AlterTable
ALTER TABLE "students"
  DROP CONSTRAINT "students_pkey",
  DROP COLUMN "id",
  DROP COLUMN "status",
  ADD CONSTRAINT "students_pkey" PRIMARY KEY ("student_id");

-- DropEnum
DROP TYPE "StudentStatus";
