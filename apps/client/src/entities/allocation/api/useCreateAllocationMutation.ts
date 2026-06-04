import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'

import type {
  Allocation,
  CreateAllocationPayload,
} from '../model/types'
import { createAllocation } from './allocationApi'
import { allocationKeys } from './allocationQueryKeys'

export function useCreateAllocationMutation() {
  const queryClient = useQueryClient()

  return useMutation<Allocation, Error, CreateAllocationPayload>({
    mutationFn: createAllocation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allocationKeys.all })
      invalidateDerivedBudgetCaches(queryClient)
    },
  })
}
