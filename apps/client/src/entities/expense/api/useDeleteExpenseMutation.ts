import { useMutation, useQueryClient } from '@tanstack/react-query'

import { removeFromListQuery } from '@/shared/lib/queryCache/listQueryCache'

import { invalidateExpenseDerivedCaches } from '../lib/expenseMutationCache'
import { invalidateExpenseHistoryCache } from './invalidateExpenseHistoryCache'
import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { todayDateInputValue } from '@/shared/lib/date'
import type { Expense } from '../model/types'
import { deleteExpense } from './expenseApi'
import { expenseQueryKeys } from './expenseQueryKeys'

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteExpense,
    onSuccess: (_data, id) => {
      const deleted = queryClient
        .getQueryData<Expense[]>(expenseQueryKeys.list())
        ?.find((expense) => expense.id === id)

      removeFromListQuery(queryClient, expenseQueryKeys.list(), id)

      if (deleted) {
        invalidateExpenseDerivedCaches(queryClient, deleted)
        return
      }

      invalidateExpenseHistoryCache(queryClient)
      invalidateDerivedBudgetCaches(queryClient, {
        asOf: todayDateInputValue(),
      })
    },
  })
}
