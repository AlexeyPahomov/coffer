import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateInListQuery } from '@/shared/lib/queryCache/listQueryCache'

import { invalidateExpenseDerivedCaches } from '../lib/expenseMutationCache'
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
    onSuccess: (expense) => {
      updateInListQuery(queryClient, expenseQueryKeys.list(), expense.id, expense)
      invalidateExpenseDerivedCaches(queryClient, expense, {
        invalidateAllHistory: true,
      })
    },
  })
}
