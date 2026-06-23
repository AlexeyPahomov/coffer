import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { toPoolCommitmentRows } from '@/entities/planned-expense/lib/plannedExpenseCommitmentRows'
import { buildMonthProjection } from '@coffer/planning-core'

import type { BudgetLedgerInput } from '../model/budgetLedgerInput'
import type { CategoryBudgetItem } from '../model/types'
import type { OperationalSummary } from '../model/operationalSummary'

import { computeOpeningFreePoolForPeriod, resolveFreePoolCarryMeta } from './computeFreePoolCarry'
import {
  computeSavingsReserveBalance,
  findSavingsCategory,
} from './computeSavingsReserveBalance'
import {
  computeFreePoolAvailableForPeriod,
  resolvePeriodLedgerTotals,
} from './periodLedgerTotals'
import { formatPeriodMonthLabel } from './periodLabels'
import { toReserveCategorySummary } from './reserveCategorySummary'

export { sumExpenseOverspendCharge } from './envelopeOverspend'

export type OperationalSummaryOverrides = {
  openingFreePool?: number
  freePoolExpenseTotal?: number
  overspendCharge?: number
}

/**
 * Операционная сводка за месяц по уже посчитанным конвертам (без повторного build).
 */
export function computeOperationalSummary(
  budgetItems: readonly CategoryBudgetItem[],
  ledger: BudgetLedgerInput,
  periodMonth: string,
  plannedExpenses: readonly PlannedExpense[] = [],
  overrides?: OperationalSummaryOverrides,
): OperationalSummary {
  const { incomeTotal, allocatedTotal, spentTotal } = resolvePeriodLedgerTotals(
    ledger,
    periodMonth,
  )
  const inReserve = computeSavingsReserveBalance(
    ledger.categories,
    ledger.allocations,
    ledger.expenses,
  )
  const poolOpening =
    overrides?.openingFreePool ??
    computeOpeningFreePoolForPeriod(periodMonth, ledger)
  const available = computeFreePoolAvailableForPeriod(
    ledger,
    periodMonth,
    poolOpening,
    budgetItems,
    overrides,
  )
  const { carryForwardTotal, previousPeriodLabel } = resolveFreePoolCarryMeta(
    periodMonth,
    poolOpening,
  )

  const projection = buildMonthProjection({
    available,
    spentTotal,
    commitmentRows: toPoolCommitmentRows(plannedExpenses),
  })

  return {
    periodMonth,
    periodLabel: formatPeriodMonthLabel(periodMonth),
    incomeTotal,
    allocatedTotal,
    available,
    inReserve,
    spentThisMonth: spentTotal,
    carryForwardTotal,
    previousPeriodLabel,
    plannedTotal: projection.plannedTotal,
    reservedTotal: projection.reservedTotal,
    projectedFree: projection.projectedFree,
    reserveCategory: toReserveCategorySummary(
      findSavingsCategory(ledger.categories),
    ),
  }
}
