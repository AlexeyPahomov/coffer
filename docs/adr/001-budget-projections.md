# ADR 001: Budget projections and month lifecycle

## Status

Accepted (2026-05-21)

## Context

The expense page computes category envelopes by scanning all incomes, allocations, and expenses (`buildCategoryBudgets`). This is correct but does not scale and has no explicit accounting periods.

## Decision

### Source of truth

- **Events:** `Income`, `Allocation`, `Expense`
- **Projections:** `BudgetMonth`, `CategoryMonthSnapshot`
- **Immutable close artifact:** `MonthCloseReport`

Never edit projections except through a **projector** (after event mutations) or **`rebuildMonthSnapshots(userId, fromPeriod)`** (deterministic, idempotent).

### Snapshot fields

| Field | Rule |
|-------|------|
| `opening_balance`, `allocated`, `spent` | Updated incrementally |
| `closing_balance` | **Only** `computeClosing(opening, allocated, spent)` — never `closing += delta` |
| `overspent` | **Not stored**; use `closing_balance < 0` or `isOverspent()` in DTOs |

`CategoryMonthSnapshot` denormalizes `user_id`, `year`, `month` for reporting without joining `BudgetMonth`.

### Month status

- `OPEN` — events may update projections
- `CLOSED` — projections frozen; mutations targeting that period are rejected until reopen

No `REOPENED` status in v1. Reopen sets `OPEN` and runs rebuild from that month forward.

### Allocation semantics

- `Income` creates money in a monthly pool
- `Allocation` moves money (today: `INCOME_ASSIGNMENT` from income to category)
- `type`: `INCOME_ASSIGNMENT` \| `CATEGORY_TRANSFER` \| `MANUAL_ADJUSTMENT` (only first is used initially)
- `period_month` is denormalized on create (budget month for the projector)

### Concurrency

Projector runs in a transaction with row lock (`SELECT … FOR UPDATE`) or optimistic `version` on `CategoryMonthSnapshot`.

### Month open / close

- Months are created via **explicit** `open` API, not auto-created on every read (avoid ghost months)
- `close` writes `MonthCloseReport` once; historical reports must not change on later rebuilds without an explicit regen

### Client / server parity

All closing math lives in `@coffer/shared` (`computeClosing`, `addToSpent`, etc.). Client derive and server projector must use the same functions.

## Consequences

- Stage 2: projector on expense/allocation + `GET /budget-months/:period`
- Stage 3: close flow + review UI + reopen + rebuild chain

## Actual state (updated 2026-07-03)

Решение в силе; ниже — только фактические имена/детали реализации (тело решения выше не менялось):

- Детерминированный пересчёт — `BudgetMonthService.rebuildFrom(userId, fromPeriod)`
  (+ `BudgetRebuildService`), эндпоинт `POST /budget-months/:period/rebuild-from`.
  Символа `rebuildMonthSnapshots` в коде нет.
- Переводы реализованы отдельной сущностью `Transfer` (`onTransferCreated` /
  `onTransferRemoved` в проекторе), а не через `Allocation.type = CATEGORY_TRANSFER`.
- Concurrency: проектор делает отдельные запросы без интерактивной `$transaction` и
  без `SELECT … FOR UPDATE` (Supabase pooler их не поддерживает). `version` на снапшоте
  ведётся, но как optimistic-lock не enforced. (Единственная `$transaction` — в
  `persistCloseReport`: атомарная запись отчёта закрытия, не concurrency проектора.)
