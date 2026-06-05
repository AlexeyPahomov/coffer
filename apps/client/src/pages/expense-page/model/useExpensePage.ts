import { useEffect, useMemo, useState } from 'react'

import {
  toCurrentBudgetSummaryView,
  useActiveCycleBudgetCore,
  useExpensePeriodBudget,
} from '@/entities/budget'
import { filterExpenseCategories } from '@/entities/category/lib/filterExpenseCategories'
import { currentMonthInputValue } from '@/shared/lib/date'

import {
  enrichExpensesWithCategory,
  sortExpensesNewestFirst,
} from '../lib/enrichExpenses'

export function useExpensePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )

  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)
  const periodMonth = pickedPeriodMonth ?? currentMonthInputValue()

  const core = useActiveCycleBudgetCore()

  const periodBudget = useExpensePeriodBudget({
    periodMonth,
    categories: core.categories,
    incomes: core.incomes,
    allocations: core.allocations,
    expenses: core.expenses,
    budgetCycle: core.budgetCycle,
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

  const sortedExpenses = useMemo(() => {
    const enriched = enrichExpensesWithCategory(core.expenses, core.categories)
    return sortExpensesNewestFirst(enriched)
  }, [core.expenses, core.categories])

  const isBudgetPending =
    core.categoriesQuery.isPending ||
    core.incomesQuery.isPending ||
    core.allocationsQuery.isPending ||
    core.expensesQuery.isPending ||
    (core.budgetCycleQuery.isPending && core.budgetCycleQuery.data === undefined)

  const isBudgetError =
    core.categoriesQuery.isError ||
    core.incomesQuery.isError ||
    core.allocationsQuery.isError ||
    core.expensesQuery.isError ||
    core.budgetCycleQuery.isError

  const budgetError =
    core.categoriesQuery.error ??
    core.incomesQuery.error ??
    core.allocationsQuery.error ??
    core.expensesQuery.error ??
    core.budgetCycleQuery.error

  const isBudgetFetching =
    core.categoriesQuery.isFetching ||
    core.incomesQuery.isFetching ||
    core.allocationsQuery.isFetching ||
    core.expensesQuery.isFetching ||
    core.budgetCycleQuery.isFetching

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
    sortedExpenses,
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
