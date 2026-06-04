import type { QueryClient } from '@tanstack/react-query'

import { budgetCycleQueryKeys } from './budgetCycleQueryKeys'

export function invalidateBudgetCycleCache(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: budgetCycleQueryKeys.all })
}
