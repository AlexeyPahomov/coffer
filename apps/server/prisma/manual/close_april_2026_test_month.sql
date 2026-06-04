-- Закрыть апрель 2026 как тестовый учётный месяц (SQL Editor).
-- user_id как в dev-окружении:
-- '00000000-0000-0000-0000-000000000001'

-- 1) Открыть месяц, если ещё нет (можно пропустить, если уже есть строка)
INSERT INTO "BudgetMonth" ("id", "user_id", "year", "month", "status", "opened_at", "created_at")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 2026, 4, 'OPEN', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "BudgetMonth"
  WHERE user_id = '00000000-0000-0000-0000-000000000001'
    AND year = 2026 AND month = 4
);

-- 2) Закрыть месяц (после POST /budget-months/2026-04/close предпочтительнее — создаст MonthCloseReport)
UPDATE "BudgetMonth"
SET status = 'CLOSED', closed_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND year = 2026 AND month = 4;

-- Проверка
SELECT year, month, status, closed_at
FROM "BudgetMonth"
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND year = 2026 AND month = 4;
