import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { appendToListQuery } from '@/shared/lib/queryCache/listQueryCache'
import { todayDateInputValue } from '@/shared/lib/date'

import type { CreateIncomePayload, Income } from '@/entities/income/model/types'
import { createIncome } from './incomeApi'
import { incomeKeys } from './incomeQueryKeys'

export function useCreateIncomeMutation() {
  const queryClient = useQueryClient()

  return useMutation<Income, Error, CreateIncomePayload>({
    mutationFn: createIncome,
    onSuccess: (income) => {
      appendToListQuery(queryClient, incomeKeys.lists(), income)
      invalidateDerivedBudgetCaches(queryClient, {
        periodMonth: getIncomePeriodMonth(income),
        asOf: todayDateInputValue(),
      })
    },
  })
}
