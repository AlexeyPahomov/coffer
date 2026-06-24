import type { QueryClient } from '@tanstack/react-query'
import { getMonthKeyFromIso } from '@coffer/shared'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { todayDateInputValue } from '@/shared/lib/date'

import { invalidateExpenseHistoryCache } from '../api/invalidateExpenseHistoryCache'
import type { Expense } from '../model/types'

export function expensePeriodMonth(expense: Pick<Expense, 'date'>): string | undefined {
  return getMonthKeyFromIso(expense.date)
}

export function invalidateExpenseDerivedCaches(
  queryClient: QueryClient,
  expense: Pick<Expense, 'date'>,
  options?: { invalidateAllHistory?: boolean },
): void {
  const periodMonth = expensePeriodMonth(expense)

  if (options?.invalidateAllHistory || !periodMonth) {
    invalidateExpenseHistoryCache(queryClient)
  } else {
    invalidateExpenseHistoryCache(queryClient, periodMonth)
  }

  invalidateDerivedBudgetCaches(queryClient, {
    periodMonth,
    asOf: todayDateInputValue(),
  })
}
