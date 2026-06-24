import type { QueryClient } from '@tanstack/react-query'

import { budgetMonthQueryKeys } from './budgetMonthQueryKeys'

export type BudgetMonthCacheScope = {
  periodMonth?: string
}

export function invalidateBudgetMonthCache(
  queryClient: QueryClient,
  scope?: BudgetMonthCacheScope,
): void {
  if (scope?.periodMonth) {
    void queryClient.invalidateQueries({
      queryKey: budgetMonthQueryKeys.byPeriod(scope.periodMonth),
    })
    return
  }

  void queryClient.invalidateQueries({ queryKey: budgetMonthQueryKeys.all })
}
