-- Backfill has_linked_phone for existing rows that already have a phone number
UPDATE students SET has_linked_phone = true WHERE phone IS NOT NULL AND phone != '';
UPDATE teachers SET has_linked_phone = true WHERE phone IS NOT NULL AND phone != '';
