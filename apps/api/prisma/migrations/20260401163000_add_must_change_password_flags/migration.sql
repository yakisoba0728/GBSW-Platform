ALTER TABLE "students"
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "teachers"
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT TRUE;
