import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { getAllocationPeriodMonthKey } from '@/entities/allocation/lib/getAllocationPeriodMonthKey'
import { appendToListQuery } from '@/shared/lib/queryCache/listQueryCache'
import { todayDateInputValue } from '@/shared/lib/date'

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
    onSuccess: (allocation) => {
      appendToListQuery(queryClient, allocationKeys.allList(), allocation)
      invalidateDerivedBudgetCaches(queryClient, {
        periodMonth: getAllocationPeriodMonthKey(allocation),
        asOf: todayDateInputValue(),
      })
    },
  })
}
