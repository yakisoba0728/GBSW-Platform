CREATE INDEX IF NOT EXISTS "students_school_is_active_current_class_current_number_idx"
ON "students"("school", "is_active", "current_class_number", "current_student_number");

CREATE INDEX IF NOT EXISTS "teachers_is_active_name_idx"
ON "teachers"("is_active", "name");
