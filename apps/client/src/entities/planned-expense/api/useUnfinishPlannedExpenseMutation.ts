import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateBudgetMonthCache } from '@/entities/budget-month/api/invalidateBudgetMonthCache'
import { expenseQueryKeys } from '@/entities/expense/api/expenseQueryKeys'

import type { PlannedExpense } from '../model/types'
import { plannedExpenseQueryKeys } from './plannedExpenseQueryKeys'
import { unfinishPlannedExpense } from './plannedExpenseApi'

export function useUnfinishPlannedExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation<PlannedExpense, Error, string>({
    mutationFn: (id) => unfinishPlannedExpense(id),
    onSuccess: (plannedExpense) => {
      queryClient.setQueriesData<PlannedExpense[]>(
        { queryKey: plannedExpenseQueryKeys.all },
        (old) =>
          old?.map((item) =>
            item.id === plannedExpense.id ? plannedExpense : item,
          ),
      )
      void queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all })
      invalidateBudgetMonthCache(queryClient)
    },
  })
}
