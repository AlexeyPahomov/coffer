-- Индекс под FK: ON DELETE SET NULL при удалении события не сканирует всю таблицу планов.
CREATE INDEX "PlannedExpense_event_id_idx" ON "PlannedExpense" ("event_id");
