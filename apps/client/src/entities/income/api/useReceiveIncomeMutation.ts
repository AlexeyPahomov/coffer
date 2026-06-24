import { useMutation, useQueryClient } from '@tanstack/react-query'

import { allocationKeys } from '@/entities/allocation/api/allocationQueryKeys'
import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { updateInListQuery } from '@/shared/lib/queryCache/listQueryCache'
import { todayDateInputValue } from '@/shared/lib/date'

import type { Income } from '../model/types'
import { incomeKeys } from './incomeQueryKeys'
import { receiveIncome } from './incomeApi'
import { DEV_USER_ID } from '@/shared/lib/constants'

export function useReceiveIncomeMutation() {
  const queryClient = useQueryClient()

  return useMutation<Income, Error, string>({
    mutationFn: (id) => receiveIncome(id, DEV_USER_ID),
    onSuccess: (income) => {
      updateInListQuery(queryClient, incomeKeys.lists(), income.id, income)
      void queryClient.invalidateQueries({ queryKey: allocationKeys.all })
      invalidateDerivedBudgetCaches(queryClient, {
        periodMonth: getIncomePeriodMonth(income),
        asOf: todayDateInputValue(),
        includeBootstrap: true,
      })
    },
  })
}
