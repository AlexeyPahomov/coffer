import { useMutation, useQueryClient } from '@tanstack/react-query'

import { allocationKeys } from '@/entities/allocation/api/allocationQueryKeys'
import { invalidateDerivedBudgetCaches } from '@/entities/budget'

import type {
  ApplyAllocationRulePayload,
  ApplyAllocationRuleResult,
} from '../model/types'
import { applyAllocationRule } from './allocationRuleApi'
import { allocationRuleKeys } from './allocationRuleQueryKeys'

export function useApplyAllocationRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    ApplyAllocationRuleResult,
    Error,
    ApplyAllocationRulePayload
  >({
    mutationFn: applyAllocationRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allocationRuleKeys.all })
      void queryClient.invalidateQueries({ queryKey: allocationKeys.all })
      invalidateDerivedBudgetCaches(queryClient)
    },
  })
}
