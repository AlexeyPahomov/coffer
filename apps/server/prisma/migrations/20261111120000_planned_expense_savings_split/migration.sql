-- Разбивка плана: часть суммы берётся из конверта накоплений.
ALTER TABLE "PlannedExpense" ADD COLUMN "savings_category_id" UUID;
ALTER TABLE "PlannedExpense" ADD COLUMN "savings_amount" DECIMAL(65, 30) NOT NULL DEFAULT 0;
ALTER TABLE "PlannedExpense" ADD COLUMN "completed_transfer_id" UUID;

CREATE UNIQUE INDEX "PlannedExpense_completed_transfer_id_key"
  ON "PlannedExpense"("completed_transfer_id");

ALTER TABLE "PlannedExpense"
  ADD CONSTRAINT "PlannedExpense_savings_category_id_fkey"
  FOREIGN KEY ("savings_category_id") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlannedExpense"
  ADD CONSTRAINT "PlannedExpense_completed_transfer_id_fkey"
  FOREIGN KEY ("completed_transfer_id") REFERENCES "Transfer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
