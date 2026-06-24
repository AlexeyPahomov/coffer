import { useMemo } from 'react'

import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import {
  useExpensePeriodBudget,
  usePeriodBudgetCore,
} from '@/entities/budget'
import { useCurrentBudgetCycleQuery } from '@/entities/budget-cycle/api/useCurrentBudgetCycleQuery'
import { currentMonthInputValue } from '@/shared/lib/date'

export function usePlanningPeriodBudget(
  periodMonth: string,
  plannedExpenses: readonly PlannedExpense[],
) {
  const core = usePeriodBudgetCore(periodMonth)
  const budgetCycleQuery = useCurrentBudgetCycleQuery()
  const needsBudgetCycle = periodMonth >= currentMonthInputValue()

  const periodBudget = useExpensePeriodBudget({
    periodMonth,
    categories: core.categories,
    incomes: core.incomes,
    allocations: core.allocations,
    expenses: core.expenses,
    budgetCycle: budgetCycleQuery.data,
    budgetMonthView: core.budgetMonthView,
    plannedExpenses,
  })

  const isBudgetLoading = useMemo(
    () =>
      core.isCoreLoading ||
      (needsBudgetCycle &&
        budgetCycleQuery.isPending &&
        budgetCycleQuery.data === undefined),
    [
      budgetCycleQuery.data,
      budgetCycleQuery.isPending,
      core.isCoreLoading,
      needsBudgetCycle,
    ],
  )

  return {
    core,
    periodBudget,
    budgetCycle: budgetCycleQuery.data,
    isBudgetLoading,
  }
}
