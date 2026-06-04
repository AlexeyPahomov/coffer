import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteAllocationRule } from './allocationRuleApi'
import { allocationRuleKeys } from './allocationRuleQueryKeys'

export function useDeleteAllocationRuleMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteAllocationRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allocationRuleKeys.all })
    },
  })
}
