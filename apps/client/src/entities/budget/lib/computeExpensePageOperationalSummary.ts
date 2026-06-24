import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { PeriodLedgerSummary } from '@coffer/shared'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { isPeriodLedgerSummaryForMonth } from '@/entities/period-ledger-summary/lib/isPeriodLedgerSummaryForMonth'

import type { BudgetLedgerInput } from '../model/budgetLedgerInput'
import type { CategoryBudgetItem } from '../model/types'
import type { OperationalSummary } from '../model/operationalSummary'

import { buildCategoryBudgets } from './buildCategoryBudgets'
import { computeOpeningFreePoolForPeriod } from './computeFreePoolCarry'
import {
  buildEnvelopeLimitByCategoryId,
  computeFreePoolExpensesInPeriodMonth,
} from './computeFreePoolExpensesInPeriodMonth'
import {
  computeOperationalSummary,
  sumExpenseOverspendCharge,
} from './computeOperationalSummary'

export type ComputeExpensePageOperationalSummaryParams = BudgetLedgerInput & {
  periodMonth: string
  useCycleEnvelopes: boolean
  /** Все конверты (цикл или месяц) до фильтра карточек. */
  allBudgetItems: readonly CategoryBudgetItem[]
  /** Конверты для отображения (после filterExpenseEnvelopeBudgetItems). */
  displayBudgetItems: readonly CategoryBudgetItem[]
  plannedExpenses?: readonly PlannedExpense[]
  ledgerSummary?: PeriodLedgerSummary
}

function summarizeCycleEnvelopesWithPeriodPool(
  params: ComputeExpensePageOperationalSummaryParams,
  ledger: BudgetLedgerInput,
  openingFreePool: number,
): OperationalSummary {
  const periodBudgetItems = buildCategoryBudgets(
    ledger.categories,
    ledger.allocations,
    ledger.expenses,
    ledger.incomes,
    params.periodMonth,
  )

  const cycleOverrides = isPeriodLedgerSummaryForMonth(
    params.ledgerSummary,
    params.periodMonth,
  )
    ? {
        freePoolExpenseTotal: params.ledgerSummary.freePoolExpenseTotal,
      }
    : {
        freePoolExpenseTotal: computeFreePoolExpensesInPeriodMonth(
          ledger.expenses,
          params.periodMonth,
          buildEnvelopeLimitByCategoryId(periodBudgetItems),
        ),
      }

  return computeOperationalSummary(
    periodBudgetItems,
    ledger,
    params.periodMonth,
    params.plannedExpenses ?? [],
    {
      openingFreePool,
      ...cycleOverrides,
      overspendCharge: sumExpenseOverspendCharge(params.displayBudgetItems),
    },
    params.ledgerSummary,
  )
}

/** Сводка страницы «Расход»: конверты по циклу или месяцу, пул — по учётному месяцу. */
export function computeExpensePageOperationalSummary(
  params: ComputeExpensePageOperationalSummaryParams,
): OperationalSummary {
  const ledger: BudgetLedgerInput = {
    categories: params.categories,
    incomes: params.incomes,
    allocations: params.allocations,
    expenses: params.expenses,
  }

  const openingFreePool = isPeriodLedgerSummaryForMonth(
    params.ledgerSummary,
    params.periodMonth,
  )
    ? params.ledgerSummary.openingFreePool
    : computeOpeningFreePoolForPeriod(params.periodMonth, ledger)

  if (params.useCycleEnvelopes) {
    return summarizeCycleEnvelopesWithPeriodPool(params, ledger, openingFreePool)
  }

  return computeOperationalSummary(
    params.allBudgetItems,
    ledger,
    params.periodMonth,
    params.plannedExpenses ?? [],
    { openingFreePool },
    params.ledgerSummary,
  )
}

function cycleHasActiveExpenseEnvelopes(budgetCycle: BudgetCycleView): boolean {
  return budgetCycle.snapshots.some(
    (snap) =>
      snap.categoryType === 'expense' &&
      (snap.openingBalance > 0 || snap.allocated > 0),
  )
}

export function shouldUseCycleEnvelopes(
  periodMonth: string,
  currentMonth: string,
  budgetCycle: BudgetCycleView | undefined,
): boolean {
  if (periodMonth !== currentMonth || budgetCycle == null) {
    return false
  }

  return cycleHasActiveExpenseEnvelopes(budgetCycle)
}
