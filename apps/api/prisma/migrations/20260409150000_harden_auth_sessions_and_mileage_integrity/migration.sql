ALTER TABLE "auth_sessions"
ADD COLUMN "credential_fingerprint" TEXT;

ALTER TABLE "mileage_rules"
ADD CONSTRAINT "mileage_rules_positive_score_check"
CHECK (
  "default_score" > 0
  AND ("min_score" IS NULL OR "min_score" > 0)
  AND ("max_score" IS NULL OR "max_score" > 0)
  AND (
    "min_score" IS NULL
    OR "max_score" IS NULL
    OR "min_score" <= "max_score"
  )
  AND ("min_score" IS NULL OR "default_score" >= "min_score")
  AND ("max_score" IS NULL OR "default_score" <= "max_score")
);

ALTER TABLE "mileage_entries"
ADD CONSTRAINT "mileage_entries_positive_score_check"
CHECK ("score" > 0);

CREATE OR REPLACE FUNCTION validate_mileage_entry_rule_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM 1
  FROM "mileage_rules" AS rule
  WHERE rule."id" = NEW."rule_id"
    AND rule."scope" = NEW."scope"
    AND rule."type" = NEW."type";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mileage entry rule scope/type mismatch for rule_id=%', NEW."rule_id";
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mileage_entry_rule_consistency_trigger ON "mileage_entries";

CREATE TRIGGER mileage_entry_rule_consistency_trigger
BEFORE INSERT OR UPDATE OF "rule_id", "scope", "type"
ON "mileage_entries"
FOR EACH ROW
EXECUTE FUNCTION validate_mileage_entry_rule_consistency();
