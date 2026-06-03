ALTER TABLE "PlannedExpense" ADD COLUMN "completed_expense_id" UUID;

CREATE UNIQUE INDEX "PlannedExpense_completed_expense_id_key"
  ON "PlannedExpense"("completed_expense_id");

ALTER TABLE "PlannedExpense"
  ADD CONSTRAINT "PlannedExpense_completed_expense_id_fkey"
  FOREIGN KEY ("completed_expense_id") REFERENCES "Expense"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
