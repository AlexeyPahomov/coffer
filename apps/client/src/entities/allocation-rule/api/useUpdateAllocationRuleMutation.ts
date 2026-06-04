import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { AllocationRule, AllocationRulePayload } from '../model/types'
import { updateAllocationRule } from './allocationRuleApi'
import { allocationRuleKeys } from './allocationRuleQueryKeys'

type UpdateAllocationRuleVariables = {
  id: string
  payload: AllocationRulePayload
}

export function useUpdateAllocationRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation<AllocationRule, Error, UpdateAllocationRuleVariables>({
    mutationFn: ({ id, payload }) => updateAllocationRule(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allocationRuleKeys.all })
    },
  })
}
