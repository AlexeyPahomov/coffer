import type { QueryClient } from '@tanstack/react-query'

import { periodLedgerSummaryQueryKeys } from './periodLedgerSummaryQueryKeys'

export type PeriodLedgerSummaryCacheScope = {
  periodMonth?: string
}

export function invalidatePeriodLedgerSummaryCache(
  queryClient: QueryClient,
  scope?: PeriodLedgerSummaryCacheScope,
): void {
  if (scope?.periodMonth) {
    void queryClient.invalidateQueries({
      queryKey: periodLedgerSummaryQueryKeys.byPeriod(scope.periodMonth),
    })
    return
  }

  void queryClient.invalidateQueries({
    queryKey: periodLedgerSummaryQueryKeys.all,
  })
}
