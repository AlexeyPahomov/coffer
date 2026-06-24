import { useMemo } from 'react'

import { canTrustBudgetMonthSnapshots } from '@/entities/budget-month/lib/budgetMonthSnapshotTrust'
import { useCategoriesQuery } from '@/entities/category/api/useCategoriesQuery'
import { useIncomesQuery } from '@/entities/income/api/useIncomesQuery'
import { EMPTY_ALLOCATIONS, EMPTY_EXPENSES } from '../lib/budgetEmptyLedger'
import { isBudgetEnvelopeLoading } from '../lib/isBudgetEnvelopeLoading'
import { resolveExpensePageBudgetItems } from '../lib/resolveBudgetItems'

import type { CategoryBudgetItem } from './types'
import { useBudgetPeriodQueries } from './useBudgetPeriodQueries'

export function usePeriodBudgetCore(periodMonth: string) {
  const categoriesQuery = useCategoriesQuery()
  const incomesQuery = useIncomesQuery()
  const periodQueries = useBudgetPeriodQueries(periodMonth)

  const categories = categoriesQuery.data ?? []
  const incomes = incomesQuery.data ?? []
  const { budgetMonthView, hasLedgerSummary } = periodQueries

  const trustSnapshots = useMemo(
    () => canTrustBudgetMonthSnapshots(budgetMonthView, categories, periodMonth),
    [budgetMonthView, categories, periodMonth],
  )

  const budgetItems = useMemo(
    (): CategoryBudgetItem[] =>
      resolveExpensePageBudgetItems(
        categories,
        EMPTY_ALLOCATIONS,
        EMPTY_EXPENSES,
        [],
        periodMonth,
        budgetMonthView,
        trustSnapshots,
      ),
    [budgetMonthView, categories, periodMonth, trustSnapshots],
  )

  const isCoreLoading = isBudgetEnvelopeLoading({
    categoriesQuery,
    incomesQuery,
    budgetMonthQuery: periodQueries.budgetMonthQuery,
    ledgerSummaryQuery: periodQueries.ledgerSummaryQuery,
    trustSnapshots,
    hasLedgerSummary,
    needsLedgerEvents: false,
    useCycleEnvelopes: false,
  })

  return {
    categories,
    incomes,
    allocations: EMPTY_ALLOCATIONS,
    expenses: EMPTY_EXPENSES,
    budgetItems,
    trustSnapshots,
    ...periodQueries,
    categoriesQuery,
    incomesQuery,
    isCoreLoading,
  }
}
