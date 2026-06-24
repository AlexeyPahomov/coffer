import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { BudgetMonthView } from '../model/types'

import { fetchOrOpenBudgetMonth } from './budgetMonthApi'
import { budgetMonthQueryKeys } from './budgetMonthQueryKeys'

export function useBudgetMonthQuery(periodMonth: string) {
  return useQuery<BudgetMonthView, Error>({
    queryKey: budgetMonthQueryKeys.byPeriod(periodMonth),
    queryFn: () => fetchOrOpenBudgetMonth(periodMonth),
    staleTime: 30_000,
    retry: 1,
    placeholderData: keepPreviousData,
  })
}
