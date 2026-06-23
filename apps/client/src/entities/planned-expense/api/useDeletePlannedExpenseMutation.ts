import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { PlannedExpense } from '../model/types'
import { deletePlannedExpense } from './plannedExpenseApi'
import { plannedExpenseQueryKeys } from './plannedExpenseQueryKeys'

export function useDeletePlannedExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deletePlannedExpense,
    onSuccess: (_data, id) => {
      queryClient.setQueriesData<PlannedExpense[]>(
        { queryKey: plannedExpenseQueryKeys.all },
        (old) => old?.filter((item) => item.id !== id),
      )
    },
  })
}
