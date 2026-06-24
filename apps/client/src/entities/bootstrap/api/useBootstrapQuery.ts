import { useQuery, useQueryClient } from '@tanstack/react-query'

import { currentMonthInputValue, todayDateInputValue } from '@/shared/lib/date'

import type { AppBootstrap } from '../model/types'
import { fetchBootstrap } from './bootstrapApi'
import { bootstrapQueryKeys } from './bootstrapQueryKeys'
import { seedQueryCacheFromBootstrap } from '../lib/seedQueryCacheFromBootstrap'

export function useBootstrapQuery(
  periodMonth: string = currentMonthInputValue(),
  asOf: string = todayDateInputValue(),
) {
  const queryClient = useQueryClient()

  return useQuery<AppBootstrap, Error>({
    queryKey: bootstrapQueryKeys.bundle(periodMonth, asOf),
    queryFn: async () => {
      const data = await fetchBootstrap(periodMonth, asOf)
      seedQueryCacheFromBootstrap(queryClient, data, { periodMonth, asOf })
      return data
    },
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
