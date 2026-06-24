import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { PeriodLedgerSummary } from '../model/types'

import { fetchPeriodLedgerSummary } from './periodLedgerSummaryApi'
import { periodLedgerSummaryQueryKeys } from './periodLedgerSummaryQueryKeys'

export function usePeriodLedgerSummaryQuery(periodMonth: string) {
  return useQuery<PeriodLedgerSummary, Error>({
    queryKey: periodLedgerSummaryQueryKeys.byPeriod(periodMonth),
    queryFn: () => fetchPeriodLedgerSummary(periodMonth),
    staleTime: 30_000,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}
