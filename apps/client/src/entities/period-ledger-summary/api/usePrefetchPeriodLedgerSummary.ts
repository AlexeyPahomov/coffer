import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { fetchPeriodLedgerSummary } from './periodLedgerSummaryApi'
import { periodLedgerSummaryQueryKeys } from './periodLedgerSummaryQueryKeys'

export function usePrefetchPeriodLedgerSummary(periodMonth: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const queryKey = periodLedgerSummaryQueryKeys.byPeriod(periodMonth)

    void queryClient.prefetchQuery({
      queryKey,
      queryFn: () => fetchPeriodLedgerSummary(periodMonth),
      staleTime: 30_000,
    })
  }, [periodMonth, queryClient])
}
