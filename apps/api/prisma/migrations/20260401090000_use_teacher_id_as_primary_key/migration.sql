ALTER TABLE "teachers" DROP CONSTRAINT "teachers_pkey";

DROP INDEX "teachers_teacher_id_key";

ALTER TABLE "teachers" DROP COLUMN "id";

ALTER TABLE "teachers" ADD CONSTRAINT "teachers_pkey" PRIMARY KEY ("teacher_id");
