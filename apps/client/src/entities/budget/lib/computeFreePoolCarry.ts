import { buildPeriodMonthRange, getPreviousPeriodMonth } from '@coffer/shared'

import type { BudgetLedgerInput } from '../model/budgetLedgerInput'

import { buildCategoryBudgets } from './buildCategoryBudgets'
import { computeFreePoolAvailableForPeriod } from './periodLedgerTotals'
import {
  collectPeriodMonthKeys,
  resolveEarliestPeriodMonth,
} from './periodMonthKeys'
import { formatPeriodMonthGenitive } from './periodLabels'

function computeFreePoolDeltaForPeriod(
  periodMonth: string,
  openingFreePool: number,
  ledger: BudgetLedgerInput,
): number {
  const budgetItems = buildCategoryBudgets(
    ledger.categories,
    ledger.allocations,
    ledger.expenses,
    ledger.incomes,
    periodMonth,
  )

  return computeFreePoolAvailableForPeriod(
    ledger,
    periodMonth,
    openingFreePool,
    budgetItems,
  )
}

/** Остаток свободных средств на начало учётного месяца (итерация, без рекурсии). */
export function computeOpeningFreePoolForPeriod(
  periodMonth: string,
  ledger: BudgetLedgerInput,
): number {
  const earliest = resolveEarliestPeriodMonth(
    ledger.incomes,
    ledger.allocations,
    ledger.expenses,
  )
  if (!earliest || periodMonth <= earliest) {
    return 0
  }

  const rangeEnd = getPreviousPeriodMonth(periodMonth)
  if (!rangeEnd || rangeEnd < earliest) {
    return 0
  }

  let balance = 0
  for (const month of buildPeriodMonthRange(earliest, rangeEnd)) {
    balance = computeFreePoolDeltaForPeriod(month, balance, ledger)
  }

  return balance
}

/** Перенос свободного пула на начало учётного месяца (для подсказки «Свободные средства»). */
export function resolveFreePoolCarryMeta(
  periodMonth: string,
  poolOpening: number,
): { carryForwardTotal: number; previousPeriodLabel?: string } {
  const previousPeriodMonth = getPreviousPeriodMonth(periodMonth)

  return {
    carryForwardTotal: poolOpening,
    previousPeriodLabel:
      poolOpening !== 0 && previousPeriodMonth
        ? formatPeriodMonthGenitive(previousPeriodMonth)
        : undefined,
  }
}

/** Закрытие свободных средств за учётный месяц (с переносом с прошлых месяцев). */
export function computeClosingFreePoolForPeriod(
  periodMonth: string,
  ledger: BudgetLedgerInput,
): number {
  const opening = computeOpeningFreePoolForPeriod(periodMonth, ledger)
  return computeFreePoolDeltaForPeriod(periodMonth, opening, ledger)
}

export { collectPeriodMonthKeys, resolveEarliestPeriodMonth }
