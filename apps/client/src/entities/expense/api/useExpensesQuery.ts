import { useQuery } from '@tanstack/react-query'

import type { Expense } from '../model/types'
import { getExpenses } from './expenseApi'
import { expenseQueryKeys } from './expenseQueryKeys'

type UseExpensesQueryOptions = {
  enabled?: boolean
}

export function useExpensesQuery(options?: UseExpensesQueryOptions) {
  return useQuery<Expense[], Error>({
    queryKey: expenseQueryKeys.list(),
    queryFn: getExpenses,
    enabled: options?.enabled ?? false,
  })
}
