import { useQuery } from '@tanstack/react-query'

import type { AllocationRule } from '../model/types'
import { getAllocationRules } from './allocationRuleApi'
import { allocationRuleKeys } from './allocationRuleQueryKeys'

export function useAllocationRulesQuery() {
  return useQuery<AllocationRule[], Error>({
    queryKey: allocationRuleKeys.lists(),
    queryFn: getAllocationRules,
  })
}
