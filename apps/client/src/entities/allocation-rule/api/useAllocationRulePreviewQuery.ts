import { useQuery } from '@tanstack/react-query'

import type { AllocationRulePreview } from '../model/types'
import { getAllocationRulePreview } from './allocationRuleApi'
import { allocationRuleKeys } from './allocationRuleQueryKeys'

export function useAllocationRulePreviewQuery(
  incomeId: string | null,
  ruleId?: string,
) {
  return useQuery<AllocationRulePreview, Error>({
    queryKey: allocationRuleKeys.preview(incomeId ?? '', ruleId),
    queryFn: () => getAllocationRulePreview(incomeId ?? '', ruleId),
    enabled: incomeId != null,
  })
}
