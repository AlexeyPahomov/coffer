import { useMemo } from 'react'

import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { BudgetMonthView } from '@/entities/budget-month/model/types'
import { canTrustBudgetMonthSnapshots } from '@/entities/budget-month/lib/budgetMonthSnapshotTrust'
import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { currentMonthInputValue } from '@/shared/lib/date'

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
  plannedExpenses = [],
}: UseExpensePeriodBudgetParams) {
  const useCycleEnvelopes = shouldUseCycleEnvelopes(
    periodMonth,
    currentMonthInputValue(),
    budgetCycle,
  )

  const trustSnapshots = useMemo(
    () =>
      !useCycleEnvelopes &&
      canTrustBudgetMonthSnapshots(budgetMonthView, categories, periodMonth),
    [budgetMonthView, categories, periodMonth, useCycleEnvelopes],
  )

  const allBudgetItems = useMemo((): CategoryBudgetItem[] => {
    if (useCycleEnvelopes && budgetCycle) {
      const items = buildAllExpenseBudgetItems(
        periodMonth,
        categories,
        allocations,
        expenses,
        incomes,
        budgetCycle,
        true,
      )
      return alignFreePoolCategorySpentToPeriodMonth(items, expenses, periodMonth)
    }

    return resolveExpensePageBudgetItems(
      categories,
      allocations,
      expenses,
      incomes,
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
    incomes,
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
      }),
    [
      allBudgetItems,
      allocations,
      budgetItems,
      categories,
      expenses,
      incomes,
      periodMonth,
      plannedExpenses,
      useCycleEnvelopes,
    ],
  )

  return {
    useCycleEnvelopes,
    trustSnapshots,
    allBudgetItems,
    budgetItems,
    operationalSummary,
  }
}
