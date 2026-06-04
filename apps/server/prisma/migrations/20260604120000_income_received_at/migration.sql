-- AlterTable
ALTER TABLE "Income" ADD COLUMN "received_at" TIMESTAMP(3);

-- Backfill received incomes from created_at
UPDATE "Income" SET "received_at" = "created_at" WHERE "status" = 'RECEIVED';
