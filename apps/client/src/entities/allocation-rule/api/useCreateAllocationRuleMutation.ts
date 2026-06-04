import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { AllocationRule, AllocationRulePayload } from '../model/types'
import { createAllocationRule } from './allocationRuleApi'
import { allocationRuleKeys } from './allocationRuleQueryKeys'

export function useCreateAllocationRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation<AllocationRule, Error, AllocationRulePayload>({
    mutationFn: createAllocationRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allocationRuleKeys.all })
    },
  })
}
