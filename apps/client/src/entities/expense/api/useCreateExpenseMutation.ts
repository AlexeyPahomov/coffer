import { useMutation, useQueryClient } from '@tanstack/react-query'

import { appendToListQuery } from '@/shared/lib/queryCache/listQueryCache'

import { invalidateExpenseDerivedCaches } from '../lib/expenseMutationCache'
import type { CreateExpensePayload, Expense } from '../model/types'
import { createExpense } from './expenseApi'
import { expenseQueryKeys } from './expenseQueryKeys'

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<Expense, Error, CreateExpensePayload>({
    mutationFn: createExpense,
    onSuccess: (expense) => {
      appendToListQuery(queryClient, expenseQueryKeys.list(), expense)
      invalidateExpenseDerivedCaches(queryClient, expense)
    },
  })
}
