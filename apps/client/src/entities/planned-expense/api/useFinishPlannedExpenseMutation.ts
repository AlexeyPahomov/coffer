import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { expenseQueryKeys } from '@/entities/expense/api/expenseQueryKeys'

import type { FinishPlannedExpensePayload, PlannedExpense } from '../model/types'
import { invalidatePlannedExpenseCache } from './invalidatePlannedExpenseCache'
import { finishPlannedExpense } from './plannedExpenseApi'

export type FinishPlannedExpenseMutationArgs = FinishPlannedExpensePayload & {
  id: string
}

export function useFinishPlannedExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<PlannedExpense, Error, FinishPlannedExpenseMutationArgs>({
    mutationFn: ({ id, ...payload }) => finishPlannedExpense(id, payload),
    onSuccess: () => {
      invalidatePlannedExpenseCache(queryClient)
      void queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      invalidateDerivedBudgetCaches(queryClient)
    },
  })
}
