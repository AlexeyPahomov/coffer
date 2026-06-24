import type { QueryClient } from '@tanstack/react-query'

import { budgetCycleQueryKeys } from './budgetCycleQueryKeys'

export type BudgetCycleCacheScope = {
  asOf?: string
}

export function invalidateBudgetCycleCache(
  queryClient: QueryClient,
  scope?: BudgetCycleCacheScope,
): void {
  if (scope?.asOf) {
    void queryClient.invalidateQueries({
      queryKey: budgetCycleQueryKeys.current(scope.asOf),
    })
    return
  }

  void queryClient.invalidateQueries({ queryKey: budgetCycleQueryKeys.all })
}
