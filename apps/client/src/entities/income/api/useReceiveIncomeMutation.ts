import { useMutation, useQueryClient } from '@tanstack/react-query'

import { allocationKeys } from '@/entities/allocation/api/allocationQueryKeys'
import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { DEV_USER_ID } from '@/shared/lib/constants'

import type { Income } from '../model/types'
import { incomeKeys } from './incomeQueryKeys'
import { receiveIncome } from './incomeApi'

export function useReceiveIncomeMutation() {
  const queryClient = useQueryClient()

  return useMutation<Income, Error, string>({
    mutationFn: (id) => receiveIncome(id, DEV_USER_ID),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: allocationKeys.all })
      invalidateDerivedBudgetCaches(queryClient)
    },
  })
}
