import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'

import type { Allocation, UpdateAllocationPayload } from '../model/types'
import { updateAllocation } from './allocationApi'
import { allocationKeys } from './allocationQueryKeys'

type UpdateAllocationVariables = {
  id: string
  payload: UpdateAllocationPayload
}

export function useUpdateAllocationMutation() {
  const queryClient = useQueryClient()

  return useMutation<Allocation, Error, UpdateAllocationVariables>({
    mutationFn: ({ id, payload }) => updateAllocation(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allocationKeys.all })
      invalidateDerivedBudgetCaches(queryClient)
    },
  })
}
