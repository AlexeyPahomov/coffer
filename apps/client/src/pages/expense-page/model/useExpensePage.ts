import { useEffect, useMemo, useState } from 'react'

import {
  toCurrentBudgetSummaryView,
  useActiveCycleBudgetCore,
  useExpensePeriodBudget,
} from '@/entities/budget'
import { isBudgetEnvelopeLoading } from '@/entities/budget/lib/isBudgetEnvelopeLoading'
import { useBudgetMonthQuery } from '@/entities/budget-month/api/useBudgetMonthQuery'
import { usePrefetchBudgetMonth } from '@/entities/budget-month/api/usePrefetchBudgetMonth'
import { filterExpenseCategories } from '@/entities/category/lib/filterExpenseCategories'
import { currentMonthInputValue } from '@/shared/lib/date'

export function useExpensePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )

  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)
  const periodMonth = pickedPeriodMonth ?? currentMonthInputValue()

  usePrefetchBudgetMonth(periodMonth)

  const core = useActiveCycleBudgetCore()
  const budgetMonthQuery = useBudgetMonthQuery(periodMonth)

  const periodBudget = useExpensePeriodBudget({
    periodMonth,
    categories: core.categories,
    incomes: core.incomes,
    allocations: core.allocations,
    expenses: core.expenses,
    budgetCycle: core.budgetCycle,
    budgetMonthView: budgetMonthQuery.data,
  })

  const expenseCategories = useMemo(
    () => filterExpenseCategories(core.categories),
    [core.categories],
  )

  const budgetItems = periodBudget.budgetItems

  useEffect(() => {
    if (
      selectedCategoryId == null ||
      budgetItems.some((item) => item.category.id === selectedCategoryId)
    ) {
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setSelectedCategoryId(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [budgetItems, selectedCategoryId])

  const currentBudgetView = useMemo(
    () =>
      periodBudget.operationalSummary
        ? toCurrentBudgetSummaryView(periodBudget.operationalSummary)
        : null,
    [periodBudget.operationalSummary],
  )

  const useCycleEnvelopes = periodBudget.useCycleEnvelopes

  const isBudgetPending = isBudgetEnvelopeLoading({
    categoriesQuery: core.categoriesQuery,
    incomesQuery: core.incomesQuery,
    budgetMonthQuery,
    allocationsQuery: core.allocationsQuery,
    expensesQuery: core.expensesQuery,
    budgetCycleQuery: core.budgetCycleQuery,
    trustSnapshots: periodBudget.trustSnapshots,
    useCycleEnvelopes,
  })

  const isBudgetError =
    core.categoriesQuery.isError ||
    core.incomesQuery.isError ||
    (!useCycleEnvelopes && budgetMonthQuery.isError) ||
    core.allocationsQuery.isError ||
    core.expensesQuery.isError ||
    (useCycleEnvelopes && core.budgetCycleQuery.isError)

  const budgetError =
    core.categoriesQuery.error ??
    core.incomesQuery.error ??
    (!useCycleEnvelopes ? budgetMonthQuery.error : null) ??
    core.allocationsQuery.error ??
    core.expensesQuery.error ??
    (useCycleEnvelopes ? core.budgetCycleQuery.error : null)

  const isBudgetFetching =
    core.categoriesQuery.isFetching ||
    core.incomesQuery.isFetching ||
    (!useCycleEnvelopes && budgetMonthQuery.isFetching) ||
    core.allocationsQuery.isFetching ||
    core.expensesQuery.isFetching ||
    (useCycleEnvelopes && core.budgetCycleQuery.isFetching)

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    periodMonth,
    setPeriodMonth: (nextPeriodMonth: string) =>
      setPickedPeriodMonth(nextPeriodMonth),
    expenseCategories,
    incomes: core.incomes,
    allocations: core.allocations,
    allBudgetItems: periodBudget.allBudgetItems,
    budgetItems,
    currentBudgetView,
    categories: core.categories,
    isBudgetPending,
    isBudgetError,
    budgetError,
    isBudgetFetching,
    categoriesQuery: core.categoriesQuery,
    incomesQuery: core.incomesQuery,
    allocationsQuery: core.allocationsQuery,
    expensesQuery: core.expensesQuery,
    budgetCycleQuery: core.budgetCycleQuery,
  }
}
