-- Связь плана с расходом после «Провести» (отмена проведения / unfinish).
-- Supabase → SQL Editor → New query → Run.
-- После выполнения локально: cd apps/server && pnpm run db:generate
--
-- Если колонку уже добавили как TEXT (ошибка FK 42804), скрипт приведёт тип к UUID.

ALTER TABLE "PlannedExpense"
  ADD COLUMN IF NOT EXISTS "completed_expense_id" UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PlannedExpense'
      AND column_name = 'completed_expense_id'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "PlannedExpense"
      ALTER COLUMN "completed_expense_id" TYPE UUID
      USING NULLIF(TRIM("completed_expense_id"), '')::uuid;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "PlannedExpense_completed_expense_id_key"
  ON "PlannedExpense" ("completed_expense_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PlannedExpense_completed_expense_id_fkey'
  ) THEN
    ALTER TABLE "PlannedExpense"
      ADD CONSTRAINT "PlannedExpense_completed_expense_id_fkey"
      FOREIGN KEY ("completed_expense_id")
      REFERENCES "Expense" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
