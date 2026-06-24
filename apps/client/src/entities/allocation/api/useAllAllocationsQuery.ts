import { useQuery } from '@tanstack/react-query'

import type { Allocation } from '../model/types'
import { getAllAllocations } from './allocationApi'
import { allocationKeys } from './allocationQueryKeys'

type UseAllAllocationsQueryOptions = {
  enabled?: boolean
}

export function useAllAllocationsQuery(options?: UseAllAllocationsQueryOptions) {
  return useQuery<Allocation[], Error>({
    queryKey: allocationKeys.allList(),
    queryFn: getAllAllocations,
    enabled: options?.enabled ?? false,
  })
}
