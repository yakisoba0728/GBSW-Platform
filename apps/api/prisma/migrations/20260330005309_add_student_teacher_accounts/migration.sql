-- CreateEnum
CREATE TYPE "School" AS ENUM ('GBSW', 'BYMS');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ENROLLED', 'LEAVE');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('ACTIVE', 'LEAVE');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school" "School" NOT NULL,
    "admission_year" INTEGER NOT NULL,
    "class_number" INTEGER NOT NULL,
    "student_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ENROLLED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "TeacherStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_student_id_key" ON "students"("student_id");

-- CreateIndex
CREATE INDEX "students_school_admission_year_class_number_student_number_idx" ON "students"("school", "admission_year", "class_number", "student_number");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_teacher_id_key" ON "teachers"("teacher_id");
