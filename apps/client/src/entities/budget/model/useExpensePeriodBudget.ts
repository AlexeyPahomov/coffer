import { useMemo } from 'react'

import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { BudgetMonthView } from '@/entities/budget-month/model/types'
import { canTrustBudgetMonthSnapshots } from '@/entities/budget-month/lib/budgetMonthSnapshotTrust'
import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import type { PeriodLedgerSummary } from '@/entities/period-ledger-summary'
import { isPeriodLedgerSummaryForMonth } from '@/entities/period-ledger-summary/lib/isPeriodLedgerSummaryForMonth'
import { currentMonthInputValue } from '@/shared/lib/date'

import { alignFreePoolCategorySpentFromLedgerSummary } from '../lib/alignFreePoolCategorySpentFromLedgerSummary'
import { alignFreePoolCategorySpentToPeriodMonth } from '../lib/alignFreePoolCategorySpentToPeriodMonth'
import {
  buildAllExpenseBudgetItems,
  toDisplayExpenseBudgetItems,
} from '../lib/buildExpenseBudgetItems'
import {
  computeExpensePageOperationalSummary,
  shouldUseCycleEnvelopes,
} from '../lib/computeExpensePageOperationalSummary'
import { resolveExpensePageBudgetItems } from '../lib/resolveBudgetItems'

import type { CategoryBudgetItem } from './types'
import type { OperationalSummary } from './operationalSummary'

export { shouldUseCycleEnvelopes } from '../lib/computeExpensePageOperationalSummary'

export type UseExpensePeriodBudgetParams = {
  periodMonth: string
  categories: readonly Category[]
  incomes: readonly Income[]
  allocations: readonly Allocation[]
  expenses: readonly Expense[]
  budgetCycle: BudgetCycleView | undefined
  budgetMonthView?: BudgetMonthView
  ledgerSummary?: PeriodLedgerSummary
  plannedExpenses?: readonly PlannedExpense[]
}

export function useExpensePeriodBudget({
  periodMonth,
  categories,
  incomes,
  allocations,
  expenses,
  budgetCycle,
  budgetMonthView,
  ledgerSummary,
  plannedExpenses = [],
}: UseExpensePeriodBudgetParams) {
  const useCycleEnvelopes = shouldUseCycleEnvelopes(
    periodMonth,
    currentMonthInputValue(),
    budgetCycle,
  )

  const hasLedgerSummary = isPeriodLedgerSummaryForMonth(
    ledgerSummary,
    periodMonth,
  )

  const trustSnapshots = useMemo(
    () =>
      !useCycleEnvelopes &&
      canTrustBudgetMonthSnapshots(budgetMonthView, categories, periodMonth),
    [budgetMonthView, categories, periodMonth, useCycleEnvelopes],
  )

  const allBudgetItems = useMemo((): CategoryBudgetItem[] => {
    if (useCycleEnvelopes && budgetCycle) {
      let items = buildAllExpenseBudgetItems(
        periodMonth,
        categories,
        allocations,
        expenses,
        incomes,
        budgetCycle,
        true,
      )

      if (hasLedgerSummary && ledgerSummary) {
        items = alignFreePoolCategorySpentFromLedgerSummary(items, ledgerSummary)
      } else {
        items = alignFreePoolCategorySpentToPeriodMonth(
          items,
          expenses,
          periodMonth,
        )
      }

      return items
    }

    return resolveExpensePageBudgetItems(
      categories,
      trustSnapshots || hasLedgerSummary ? [] : allocations,
      trustSnapshots || hasLedgerSummary ? [] : expenses,
      trustSnapshots || hasLedgerSummary ? [] : incomes,
      periodMonth,
      budgetMonthView,
      trustSnapshots,
    )
  }, [
    allocations,
    budgetCycle,
    budgetMonthView,
    categories,
    expenses,
    hasLedgerSummary,
    incomes,
    ledgerSummary,
    periodMonth,
    trustSnapshots,
    useCycleEnvelopes,
  ])

  const budgetItems = useMemo(
    () => toDisplayExpenseBudgetItems(allBudgetItems),
    [allBudgetItems],
  )

  const operationalSummary = useMemo(
    (): OperationalSummary =>
      computeExpensePageOperationalSummary({
        periodMonth,
        categories,
        incomes,
        allocations,
        expenses,
        useCycleEnvelopes,
        allBudgetItems,
        displayBudgetItems: budgetItems,
        plannedExpenses,
        ledgerSummary,
      }),
    [
      allBudgetItems,
      allocations,
      budgetItems,
      categories,
      expenses,
      incomes,
      ledgerSummary,
      periodMonth,
      plannedExpenses,
      useCycleEnvelopes,
    ],
  )

  return {
    useCycleEnvelopes,
    trustSnapshots,
    hasLedgerSummary,
    allBudgetItems,
    budgetItems,
    operationalSummary,
  }
}
