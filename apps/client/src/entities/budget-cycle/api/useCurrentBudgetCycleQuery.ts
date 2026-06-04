import { useQuery } from '@tanstack/react-query'

import { todayDateInputValue } from '@/shared/lib/date'

import type { BudgetCycleView } from '../model/types'

import { fetchCurrentBudgetCycle } from './budgetCycleApi'
import { budgetCycleQueryKeys } from './budgetCycleQueryKeys'

export function useCurrentBudgetCycleQuery(asOf: string = todayDateInputValue()) {
  return useQuery<BudgetCycleView, Error>({
    queryKey: budgetCycleQueryKeys.current(asOf),
    queryFn: () => fetchCurrentBudgetCycle(asOf),
    staleTime: 30_000,
    retry: 1,
  })
}
