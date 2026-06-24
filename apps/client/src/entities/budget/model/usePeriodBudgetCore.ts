import { useMemo } from 'react'

import { useAllAllocationsQuery } from '@/entities/allocation/api/useAllAllocationsQuery'
import { canTrustBudgetMonthSnapshots } from '@/entities/budget-month/lib/budgetMonthSnapshotTrust'
import { useBudgetMonthQuery } from '@/entities/budget-month/api/useBudgetMonthQuery'
import { useCategoriesQuery } from '@/entities/category/api/useCategoriesQuery'
import { useExpensesQuery } from '@/entities/expense/api/useExpensesQuery'
import { useIncomesQuery } from '@/entities/income/api/useIncomesQuery'
import { isBudgetEnvelopeLoading } from '../lib/isBudgetEnvelopeLoading'
import { resolveExpensePageBudgetItems } from '../lib/resolveBudgetItems'

import type { CategoryBudgetItem } from './types'

export function usePeriodBudgetCore(periodMonth: string) {
  const categoriesQuery = useCategoriesQuery()
  const incomesQuery = useIncomesQuery()
  const allocationsQuery = useAllAllocationsQuery()
  const expensesQuery = useExpensesQuery()
  const budgetMonthQuery = useBudgetMonthQuery(periodMonth)

  const categories = categoriesQuery.data ?? []
  const incomes = incomesQuery.data ?? []
  const allocations = allocationsQuery.data ?? []
  const expenses = expensesQuery.data ?? []
  const budgetMonthView = budgetMonthQuery.data

  const trustSnapshots = useMemo(
    () => canTrustBudgetMonthSnapshots(budgetMonthView, categories, periodMonth),
    [budgetMonthView, categories, periodMonth],
  )

  const budgetItems = useMemo(
    (): CategoryBudgetItem[] =>
      resolveExpensePageBudgetItems(
        categories,
        allocations,
        expenses,
        incomes,
        periodMonth,
        budgetMonthView,
        trustSnapshots,
      ),
    [
      allocations,
      budgetMonthView,
      categories,
      expenses,
      incomes,
      periodMonth,
      trustSnapshots,
    ],
  )

  const isCoreLoading = isBudgetEnvelopeLoading({
    categoriesQuery,
    incomesQuery,
    budgetMonthQuery,
    allocationsQuery,
    expensesQuery,
    trustSnapshots,
    useCycleEnvelopes: false,
  })

  return {
    categories,
    incomes,
    allocations,
    expenses,
    budgetItems,
    budgetMonthView,
    trustSnapshots,
    categoriesQuery,
    incomesQuery,
    allocationsQuery,
    expensesQuery,
    budgetMonthQuery,
    isCoreLoading,
  }
}
