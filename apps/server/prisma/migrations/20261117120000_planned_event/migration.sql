-- События: несколько планов (билеты, жильё, аренда) объединяются в одну поездку или праздник.
CREATE TABLE "PlannedEvent" (
  "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "icon_name"  TEXT NOT NULL DEFAULT 'gift',
  "icon_color" TEXT NOT NULL DEFAULT 'purple',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlannedEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlannedEvent_user_id_idx" ON "PlannedEvent" ("user_id");

ALTER TABLE "PlannedExpense" ADD COLUMN "event_id" UUID;

ALTER TABLE "PlannedExpense"
  ADD CONSTRAINT "PlannedExpense_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "PlannedEvent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
