import type { QueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { todayDateInputValue } from '@/shared/lib/date'

import { plannedExpenseQueryKeys } from './plannedExpenseQueryKeys'

export function invalidatePlannedExpenseCache(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: plannedExpenseQueryKeys.all })
  invalidateDerivedBudgetCaches(queryClient, {
    asOf: todayDateInputValue(),
    includeBootstrap: true,
  })
}
