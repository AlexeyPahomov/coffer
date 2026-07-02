# ADR 003: Steady-state outcome forecasting

## Status

Accepted (2026-07-01)

## Context

`@coffer/planning-core` already projects a liquidity chain (`buildForecastChain`, ADR 002). But the planning UI only fed it **planned events**: manually-entered `EXPECTED` income, allocation-rule splits, and explicit planned expenses. It could not answer the user question *"if I keep spending as usual and execute my plans, what will my free pool and savings be in N months?"* — there was no notion of steady-state behaviour (recurring income, baseline consumption) beyond the next month.

The existing planning timeline is only 3 months wide (prev / current / next), so it cannot express a 3–12 month horizon.

## Decision

### Baseline spending = allocation rules

Every `Expense` is tied to a category envelope (no direct pool spend). In steady state, the amount routed into an envelope by allocation rules **is** the assumed monthly consumption of that category:

- **Expense envelopes:** rule allocation = baseline spend (leaves the system). No new "budget norm" entity, no expense-history analysis.
- **Savings envelopes:** rule allocation = accumulation (savings grow).

This makes the two headline metrics fall out of the existing engine: the free-pool chain already subtracts allocations, and savings is the cumulative savings allocation.

### Recurring income: explicit `EXPECTED` → else fact

Per forecast month, income is resolved as: use entered `EXPECTED` incomes if any; otherwise, for months **strictly after** the current calendar month, replicate a "typical month" from history. The template takes only **recurring streams** — a stream `(income_type, source)` seen in **≥2 distinct received months** — using each such stream's latest month. One-off incomes (bonus, refund, help, interest) are excluded, otherwise the template sums the last of every stream ever received and wildly overstates a monthly income. Source is preserved because allocation-rule matching depends on it (аванс vs расчёт). The current and past months are never extrapolated (only real `EXPECTED`), so opening balance is not double-counted.

`resolveRecurringIncomeTemplate` / `buildProjectedIncomes` — `apps/client/src/entities/income/lib/projectRecurringIncome.ts`.

### Single projected-income source

The same `buildProjectedIncomes` output feeds both the pool chain (`buildPlanningForecast`) and the savings trajectory (`buildSavingsTrajectory`), so pool outflow and savings inflow reconcile from one income set.

### Horizon is separate from the timeline

`buildForecastHorizonMonths(periodMonth, horizon)` produces `[now, +1, …, +horizon]`, independent of the 3-month picker axis. Horizon is user-selectable (3 / 6 / 12, default 3).

### Headline

| Metric | Source |
|--------|--------|
| Free pool | `projectedFree` of the last horizon month (`buildForecastChain`) |
| Savings | cumulative `savings allocation − planned savings withdrawals` (`buildSavingsTrajectory`) |
| Trajectory | per-month free pool + savings, with deficit months flagged |

UI: `widgets/planning-outcome-forecast`. `planning-core` is **unchanged** — this is a client composition over its existing chain.

## Consequences

- Forecast reflects steady-state behaviour without any new domain entity or schema migration.
- The per-category envelope forecast (`buildEnvelopeForecastChain`) is reconciled with the headline: for **expense** envelopes the month's allocation is treated as consumed (baseline spend), so only the real remaining minus planned commitments carries to the next month — surplus/deficit propagate, the allocation does not accumulate. **Savings** envelopes still accumulate.
- **Rejected — envelope overspend charged back to the pool.** Attempted (deriving `liquidityAdjustment` from a forecasted envelope deficit) and reverted: not viable under this ADR's constraints. The limitation ("rules under-fund real spending") is about *actual* spending exceeding allocation, which requires expense-history analysis — explicitly out of scope here. Forecasting overspend from **planned** expenses instead is wrong: an envelope-scoped plan is funded by its envelope, not the free pool (only category-less plans hit the pool), so charging its overspill to the pool double-counts and understates free funds. Real *current* envelope overspend is already reflected in the free pool via `overspendCharge` (`sumExpenseOverspendCharge`) — that stays. `liquidityAdjustment` remains an engine input with no client derivation.
- The recurring-income template intentionally uses each stream's **latest month amount as-is**. A rolling-median refinement (over the last N appeared months) was considered and **rejected** — the latest actual amount is the desired forecast basis; smoothing across older months is not wanted.
