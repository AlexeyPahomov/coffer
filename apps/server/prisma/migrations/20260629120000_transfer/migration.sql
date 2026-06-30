CREATE TABLE "Transfer" (
  "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          TEXT NOT NULL,
  "from_category_id" UUID NOT NULL,
  "to_category_id"   UUID NOT NULL,
  "amount"           DECIMAL(65, 30) NOT NULL,
  "period_month"     TIMESTAMP(3) NOT NULL,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Transfer_from_category_id_fkey"
    FOREIGN KEY ("from_category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Transfer_to_category_id_fkey"
    FOREIGN KEY ("to_category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Transfer_user_id_period_month_idx"
  ON "Transfer" ("user_id", "period_month");
