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
