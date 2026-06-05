import { useMemo } from 'react'

import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
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
  plannedExpenses?: readonly PlannedExpense[]
}

export function useExpensePeriodBudget({
  periodMonth,
  categories,
  incomes,
  allocations,
  expenses,
  budgetCycle,
  plannedExpenses = [],
}: UseExpensePeriodBudgetParams) {
  const useCycleEnvelopes = shouldUseCycleEnvelopes(
    periodMonth,
    currentMonthInputValue(),
    budgetCycle,
  )

  const allBudgetItems = useMemo((): CategoryBudgetItem[] => {
    const items = buildAllExpenseBudgetItems(
      periodMonth,
      categories,
      allocations,
      expenses,
      incomes,
      budgetCycle,
      useCycleEnvelopes,
    )
    if (!useCycleEnvelopes) {
      return items
    }
    return alignFreePoolCategorySpentToPeriodMonth(items, expenses, periodMonth)
  },
    [
      useCycleEnvelopes,
      budgetCycle,
      categories,
      allocations,
      expenses,
      incomes,
      periodMonth,
    ],
  )

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
    allBudgetItems,
    budgetItems,
    operationalSummary,
  }
}
