-- null = списание из накоплений в свободный пул (без конверта-получателя).
ALTER TABLE "Transfer" ALTER COLUMN "to_category_id" DROP NOT NULL;
