# ROADMAP

Единый живой документ учёта работ по проекту: что в работе, что открыто, что
отклонено, и где текст ADR отстал от кода. Обновляется по ходу.

Архитектурные **решения** (почему код такой) — в [`docs/adr/`](adr/README.md);
здесь только **план и состояние**.

_Обновлено: 2026-07-03._

## Недавно сделано

- **Автоматические Prisma-миграции против Supabase восстановлены.** Причина сбоев
  была двойной: (1) `prisma.config.ts` брал datasource из транзакционного pooler
  (`:6543`, pgbouncer), непригодного для DDL/advisory-локов, и грузил `.env` по
  несуществующему пути `../../.env`; (2) история миграций не велась — DDL применялся
  вручную, `_prisma_migrations` отсутствовала. Исправлено: добавлен
  `DATABASE_URL_MIGRATE` (Session pooler `:5432`, IPv4, add-on не нужен),
  `prisma.config.ts` читает `apps/server/.env` и предпочитает migrate-URL; прод-база
  забэйзлайнена (`migrate resolve --applied` по 14 миграциям). `migrate status` →
  «up to date», `migrate deploy` → no-op. **Нюанс:** живая схема исторически
  расходится с migration-файлами (колонки `id`/FK — `UUID`+`gen_random_uuid()`
  против `TEXT`; precision `Decimal`/timestamp; FK `ON UPDATE`). Дрейф доброкачественный
  и `migrate deploy` его не трогает (прогоняет только новые миграции). Приводить
  prod-DDL к файлам (UUID→TEXT и т.п.) намеренно не стали — рефактор рабочего.
- **Reopen месяца (CLOSED → OPEN).** Добавлены `BudgetMonthService.reopen` +
  эндпоинт `POST /budget-months/:period/reopen`: снимает фиксацию, удаляет
  `MonthCloseReport`, гонит `rebuildFrom` вперёд. Guard: reopen отклоняется, если
  есть более поздний CLOSED-месяц («сначала переоткройте поздние»). Идемпотентен на
  OPEN. Backend-only (клиентского UI закрытия/переоткрытия пока нет). Закрыт Stage 3
  ADR-001.
- **Факты ADR-001/002 синхронизированы с кодом.** Тела решений оставлены immutable;
  в конец каждого ADR добавлен блок «Actual state» с фактическими именами/путями
  (`rebuildFrom`, сущность `Transfer`, реальная модель concurrency, расположение
  lifecycle в `apps/server/src/budget/`, прямые импорты `planning-core`). Раздел
  «Расхождения ADR ↔ код» из ROADMAP убран — дрейф теперь фиксируется в самих ADR.
- **Переводы в цикловом расчёте конвертов.** `computeCategoryBudgetsForCycle`
  теперь учитывает `Transfer` (страница «Расходы» за текущий месяц). Якорь цикла —
  `created_at` (как расход), отсев закрытых периодов — по `period_month`. Достигнут
  паритет с месячной системой.
- **Удалён dead-code `computeFreePoolExpensesForCycle`.** Цикловая free-pool
  функция ни разу не вызывалась и не учитывала переводы. Убрана; понадобится —
  восстановится по образцу `computeCategoryBudgetsForCycle`. Живой месячный аналог
  `computeFreePoolExpensesForPeriod` не затронут.

## Открытые задачи

Нет.

## Отклонено

Зафиксировано в [ADR-003](adr/003-outcome-forecasting.md):

- **Rolling median дохода** — прогнозный шаблон берёт последний месяц потока как
  есть, медиану не внедряем.
- **Overspend → свободный пул (прогноз)** — списание прогнозного перерасхода
  конвертов в пул нежизнеспособно, не переоткрывать.
