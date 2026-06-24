import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { getAllocationPeriodMonthKey } from '@/entities/allocation/lib/getAllocationPeriodMonthKey'
import { updateInListQuery } from '@/shared/lib/queryCache/listQueryCache'
import { todayDateInputValue } from '@/shared/lib/date'

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
    onSuccess: (allocation) => {
      updateInListQuery(
        queryClient,
        allocationKeys.allList(),
        allocation.id,
        allocation,
      )
      invalidateDerivedBudgetCaches(queryClient, {
        periodMonth: getAllocationPeriodMonthKey(allocation),
        asOf: todayDateInputValue(),
      })
    },
  })
}
