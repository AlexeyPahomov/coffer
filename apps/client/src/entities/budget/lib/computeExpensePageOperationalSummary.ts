import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

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

  const periodSummary = computeOperationalSummary(
    periodBudgetItems,
    ledger,
    params.periodMonth,
    params.plannedExpenses ?? [],
    {
      openingFreePool,
      freePoolExpenseTotal: computeFreePoolExpensesInPeriodMonth(
        ledger.expenses,
        params.periodMonth,
        buildEnvelopeLimitByCategoryId(periodBudgetItems),
      ),
      overspendCharge: sumExpenseOverspendCharge(params.displayBudgetItems),
    },
  )

  return periodSummary
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

  const openingFreePool = computeOpeningFreePoolForPeriod(
    params.periodMonth,
    ledger,
  )

  if (params.useCycleEnvelopes) {
    return summarizeCycleEnvelopesWithPeriodPool(params, ledger, openingFreePool)
  }

  return computeOperationalSummary(
    params.allBudgetItems,
    ledger,
    params.periodMonth,
    params.plannedExpenses ?? [],
    { openingFreePool },
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
