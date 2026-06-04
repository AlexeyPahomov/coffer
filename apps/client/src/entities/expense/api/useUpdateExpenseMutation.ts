import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'

import type { UpdateExpensePayload } from '../model/types'
import { updateExpense } from './expenseApi'
import { expenseQueryKeys } from './expenseQueryKeys'

type UpdateExpenseVariables = {
  id: string
  payload: UpdateExpensePayload
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateExpenseVariables) =>
      updateExpense(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      invalidateDerivedBudgetCaches(queryClient)
    },
  })
}
