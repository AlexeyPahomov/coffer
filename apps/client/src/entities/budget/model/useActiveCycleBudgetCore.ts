import { useMemo } from 'react'

import { useCurrentBudgetCycleQuery } from '@/entities/budget-cycle/api/useCurrentBudgetCycleQuery'
import { useCategoriesQuery } from '@/entities/category/api/useCategoriesQuery'
import { useIncomesQuery } from '@/entities/income/api/useIncomesQuery'
import { EMPTY_ALLOCATIONS, EMPTY_EXPENSES } from '../lib/budgetEmptyLedger'

import { useBudgetPeriodQueries } from './useBudgetPeriodQueries'

export function useActiveCycleBudgetCore(periodMonth: string) {
  const categoriesQuery = useCategoriesQuery()
  const incomesQuery = useIncomesQuery()
  const budgetCycleQuery = useCurrentBudgetCycleQuery()
  const periodQueries = useBudgetPeriodQueries(periodMonth)

  const categories = categoriesQuery.data ?? []
  const incomes = incomesQuery.data ?? []

  const isCoreLoading = useMemo(
    () =>
      categoriesQuery.isPending ||
      incomesQuery.isPending ||
      (budgetCycleQuery.isPending && budgetCycleQuery.data === undefined) ||
      (periodQueries.ledgerSummaryQuery.isPending &&
        periodQueries.ledgerSummaryQuery.data === undefined),
    [
      budgetCycleQuery.data,
      budgetCycleQuery.isPending,
      categoriesQuery.isPending,
      incomesQuery.isPending,
      periodQueries.ledgerSummaryQuery.data,
      periodQueries.ledgerSummaryQuery.isPending,
    ],
  )

  return {
    categories,
    incomes,
    allocations: EMPTY_ALLOCATIONS,
    expenses: EMPTY_EXPENSES,
    budgetCycle: budgetCycleQuery.data,
    ...periodQueries,
    categoriesQuery,
    incomesQuery,
    budgetCycleQuery,
    isCoreLoading,
  }
}
