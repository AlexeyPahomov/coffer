import { useMutation, useQueryClient } from '@tanstack/react-query'

import { allocationKeys } from '@/entities/allocation/api/allocationQueryKeys'
import { invalidateDerivedBudgetCaches } from '@/entities/budget'
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: allocationKeys.all })
      invalidateDerivedBudgetCaches(queryClient)
    },
  })
}
