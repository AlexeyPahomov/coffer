-- Расходные конверты по умолчанию переносят остаток между циклами.
UPDATE "Category"
SET "carry_over_policy" = 'CARRY'
WHERE "type" = 'expense'
  AND "carry_over_policy" = 'RESET';
