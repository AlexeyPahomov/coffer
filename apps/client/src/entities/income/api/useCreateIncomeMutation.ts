import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import type { CreateIncomePayload, Income } from '@/entities/income/model/types'
import { createIncome } from './incomeApi'
import { incomeKeys } from './incomeQueryKeys'

export function useCreateIncomeMutation() {
  const queryClient = useQueryClient()

  return useMutation<Income, Error, CreateIncomePayload>({
    mutationFn: createIncome,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incomeKeys.lists() })
      invalidateDerivedBudgetCaches(queryClient)
    },
  })
}
