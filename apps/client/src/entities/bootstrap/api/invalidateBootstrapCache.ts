import type { QueryClient } from '@tanstack/react-query'

import { bootstrapQueryKeys } from './bootstrapQueryKeys'

export function invalidateBootstrapCache(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: bootstrapQueryKeys.all })
}
