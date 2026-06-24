import type { QueryClient } from '@tanstack/react-query'

import { expenseQueryKeysHistoryRoot } from './expenseQueryKeys'

export function invalidateExpenseHistoryCache(
  queryClient: QueryClient,
  periodMonth?: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: expenseQueryKeysHistoryRoot(periodMonth),
    exact: false,
  })
}
