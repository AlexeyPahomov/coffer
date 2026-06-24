import { useMutation, useQueryClient } from '@tanstack/react-query'

import { allocationKeys } from '@/entities/allocation/api/allocationQueryKeys'
import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { updateInListQuery } from '@/shared/lib/queryCache/listQueryCache'
import { todayDateInputValue } from '@/shared/lib/date'

import type { Income, UpdateIncomePayload } from '@/entities/income/model/types'
import { updateIncome } from './incomeApi'
import { incomeKeys } from './incomeQueryKeys'

type UpdateIncomeVariables = {
  id: string
  payload: UpdateIncomePayload
}

export function useUpdateIncomeMutation() {
  const queryClient = useQueryClient()

  return useMutation<Income, Error, UpdateIncomeVariables>({
    mutationFn: ({ id, payload }) => updateIncome(id, payload),
    onSuccess: (income) => {
      updateInListQuery(queryClient, incomeKeys.lists(), income.id, income)
      void queryClient.invalidateQueries({ queryKey: allocationKeys.all })
      invalidateDerivedBudgetCaches(queryClient, {
        periodMonth: getIncomePeriodMonth(income),
        asOf: todayDateInputValue(),
      })
    },
  })
}
