DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "school_mileage_rules"
    GROUP BY "display_order"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add unique constraint to school_mileage_rules.display_order while duplicates exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "dorm_mileage_rules"
    GROUP BY "display_order"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add unique constraint to dorm_mileage_rules.display_order while duplicates exist.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "school_mileage_rules_display_order_key"
  ON "school_mileage_rules"("display_order");

CREATE UNIQUE INDEX IF NOT EXISTS "dorm_mileage_rules_display_order_key"
  ON "dorm_mileage_rules"("display_order");
