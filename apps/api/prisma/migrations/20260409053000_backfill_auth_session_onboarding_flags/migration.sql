-- Backfill onboarding flags on existing sessions from the linked account rows
UPDATE "auth_sessions" AS s
SET
  "has_linked_email" = COALESCE(st."has_linked_email", false),
  "has_linked_phone" = COALESCE(st."has_linked_phone", false)
FROM "students" AS st
WHERE s."role" = 'STUDENT'
  AND s."account_id" = st."student_id";

UPDATE "auth_sessions" AS s
SET
  "has_linked_email" = COALESCE(t."has_linked_email", false),
  "has_linked_phone" = COALESCE(t."has_linked_phone", false)
FROM "teachers" AS t
WHERE s."role" = 'TEACHER'
  AND s."account_id" = t."teacher_id";
