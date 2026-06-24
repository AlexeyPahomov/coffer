import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { fetchOrOpenBudgetMonth } from '@/entities/budget-month/api/budgetMonthApi'
import { budgetMonthQueryKeys } from '@/entities/budget-month/api/budgetMonthQueryKeys'

/** Догружает budget month при смене периода, если его ещё нет в кэше. */
export function usePrefetchBudgetMonth(periodMonth: string | undefined): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!periodMonth) {
      return
    }

    const queryKey = budgetMonthQueryKeys.byPeriod(periodMonth)
    const cached = queryClient.getQueryData(queryKey)
    if (cached !== undefined) {
      return
    }

    void queryClient.prefetchQuery({
      queryKey,
      queryFn: () => fetchOrOpenBudgetMonth(periodMonth),
      staleTime: 30_000,
    })
  }, [periodMonth, queryClient])
}
