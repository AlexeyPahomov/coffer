# ROADMAP

Единый живой документ учёта работ по проекту: что в работе, что открыто, что
отклонено, и где текст ADR отстал от кода. Обновляется по ходу.

Архитектурные **решения** (почему код такой) — в [`docs/adr/`](adr/README.md);
здесь только **план и состояние**.

_Обновлено: 2026-07-02._

## Недавно сделано

- **Переводы в цикловом расчёте конвертов.** `computeCategoryBudgetsForCycle`
  теперь учитывает `Transfer` (страница «Расходы» за текущий месяц). Якорь цикла —
  `created_at` (как расход), отсев закрытых периодов — по `period_month`. Достигнут
  паритет с месячной системой.

## Открытые задачи

- **Prisma-миграции против Supabase.** Вернуться к автоматическим
  `prisma migrate deploy`. Раньше падали соединения; схема правится вручную через
  SQL Editor — рабочий, но хрупкий режим. Вероятная причина: pooler (порт 6543,
  Transaction mode) не годится для DDL — нужен direct connection (5432).
- **Reopen месяца (CLOSED → OPEN).** ADR-001 описывает reopen как решённое
  (переводит месяц в OPEN и запускает rebuild вперёд), но операции flip CLOSED→OPEN
  в коде нет. Есть только `rebuildFrom` (пересчёт вперёд по OPEN-месяцам). Stage 3
  из ADR-001 не завершён.
- **Переводы в цикловой `computeFreePoolExpensesForCycle`.** Функция сейчас нигде
  не вызывается (dead code) и переводы не учитывает. Если она понадобится — не
  забыть протянуть в неё transfers, как в `computeCategoryBudgetsForCycle`.
- **Править фактический дрейф в ADR-001/002 in-place.** Тексты содержат отставшие
  факты (перечислены в разделе «Расхождения ADR ↔ код»): имена функций, расположение
  модулей, описание concurrency. Решения в силе — правка хирургическая, только факты,
  без изменения самих решений. Цель — держать журнал точным; после правки убрать
  соответствующие пункты из «Расхождения».

## Расхождения ADR ↔ код (тела ADR не правим)

Решения в силе, но отдельные факты в тексте отстали. Читая ADR, держать в уме:

**ADR-001:**
- Пересчёт называется `BudgetMonthService.rebuildFrom(userId, fromPeriod)` +
  `BudgetRebuildService` (эндпоинт `POST /budget-months/:period/rebuild-from`), а не
  `rebuildMonthSnapshots`.
- Переводы — отдельная сущность `Transfer` с `onTransferCreated/Removed` в
  проекторе, а не `Allocation.type = CATEGORY_TRANSFER`.
- Concurrency: интерактивных транзакций и `SELECT … FOR UPDATE` нет (Supabase
  pooler их не поддерживает); `version` ведётся, но как optimistic-lock не
  enforced.

**ADR-002:**
- Close / reopen / validate живут в `apps/server/src/budget/`
  (`budget-month.service.ts` и др.), а не в `planning/month-lifecycle/`.
- `processes/forecasting` — фасад для виджетов, но слои `pages`/`entities` местами
  импортируют `@coffer/planning-core` напрямую (мелкий долг).

## Отклонено

Зафиксировано в [ADR-003](adr/003-outcome-forecasting.md):

- **Rolling median дохода** — прогнозный шаблон берёт последний месяц потока как
  есть, медиану не внедряем.
- **Overspend → свободный пул (прогноз)** — списание прогнозного перерасхода
  конвертов в пул нежизнеспособно, не переоткрывать.
