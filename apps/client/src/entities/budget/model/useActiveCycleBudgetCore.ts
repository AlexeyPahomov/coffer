import { useMemo } from 'react'

import { useAllAllocationsQuery } from '@/entities/allocation/api/useAllAllocationsQuery'
import { mapBudgetCycleToCategoryItems } from '@/entities/budget-cycle/lib/mapBudgetCycleToCategoryItems'
import { useCurrentBudgetCycleQuery } from '@/entities/budget-cycle/api/useCurrentBudgetCycleQuery'
import { useCategoriesQuery } from '@/entities/category/api/useCategoriesQuery'
import { useExpensesQuery } from '@/entities/expense/api/useExpensesQuery'
import { useIncomesQuery } from '@/entities/income/api/useIncomesQuery'
import { sortBudgetItemsForDisplay } from '../lib/buildCategoryBudgets'
import { filterExpenseEnvelopeBudgetItems } from '../lib/filterExpenseEnvelopeBudgetItems'

import type { CategoryBudgetItem } from './types'

export function useActiveCycleBudgetCore() {
  const categoriesQuery = useCategoriesQuery()
  const incomesQuery = useIncomesQuery()
  const allocationsQuery = useAllAllocationsQuery()
  const expensesQuery = useExpensesQuery()
  const budgetCycleQuery = useCurrentBudgetCycleQuery()

  const categories = categoriesQuery.data ?? []
  const incomes = incomesQuery.data ?? []
  const allocations = allocationsQuery.data ?? []
  const expenses = expensesQuery.data ?? []

  const budgetItems = useMemo((): CategoryBudgetItem[] => {
    const cycle = budgetCycleQuery.data
    if (!cycle) {
      return []
    }
    const items = mapBudgetCycleToCategoryItems(cycle, categories)
    return sortBudgetItemsForDisplay(filterExpenseEnvelopeBudgetItems(items))
  }, [budgetCycleQuery.data, categories])

  const isCoreLoading =
    categoriesQuery.isPending ||
    incomesQuery.isPending ||
    allocationsQuery.isPending ||
    expensesQuery.isPending ||
    (budgetCycleQuery.isPending && budgetCycleQuery.data === undefined)

  return {
    categories,
    incomes,
    allocations,
    expenses,
    budgetItems,
    budgetCycle: budgetCycleQuery.data,
    categoriesQuery,
    incomesQuery,
    allocationsQuery,
    expensesQuery,
    budgetCycleQuery,
    isCoreLoading,
  }
}
