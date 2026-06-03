import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateBudgetMonthCache } from '@/entities/budget-month/api/invalidateBudgetMonthCache'

import type { Expense } from '../model/types'
import { deleteExpense } from './expenseApi'
import { expenseQueryKeys } from './expenseQueryKeys'

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteExpense,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Expense[]>(expenseQueryKeys.list(), (old) =>
        old?.filter((expense) => expense.id !== id),
      )
      void queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      invalidateBudgetMonthCache(queryClient)
    },
  })
}
