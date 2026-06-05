-- Расходные конверты: перенос остатка между циклами (Supabase SQL Editor)
-- Колонка carry_over_policy должна уже существовать (см. 20260525200000_planning_reserved_carryover.sql)

BEGIN;

UPDATE "Category"
SET "carry_over_policy" = 'CARRY'
WHERE "type" = 'expense'
  AND "carry_over_policy" = 'RESET';

COMMIT;

-- Проверка (опционально):
-- SELECT name, type, carry_over_policy
-- FROM "Category"
-- WHERE type = 'expense'
-- ORDER BY name;
