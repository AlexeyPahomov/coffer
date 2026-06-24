import { useInfiniteQuery } from '@tanstack/react-query'

import type { Expense } from '../model/types'
import { getExpenseHistoryPage } from './expenseApi'
import { expenseQueryKeys } from './expenseQueryKeys'

const HISTORY_PAGE_SIZE = 50

export function useExpenseHistoryQuery(
  periodMonth: string,
  categoryId: string = 'all',
) {
  const serverCategoryId = categoryId === 'all' ? undefined : categoryId

  return useInfiniteQuery({
    queryKey: expenseQueryKeys.history(periodMonth, categoryId),
    queryFn: ({ pageParam }) =>
      getExpenseHistoryPage({
        periodMonth,
        categoryId: serverCategoryId,
        cursor: pageParam,
        limit: HISTORY_PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  })
}

export function flattenExpenseHistoryPages(
  pages: Array<{ items: Expense[] }> | undefined,
): Expense[] {
  if (!pages) {
    return []
  }
  return pages.flatMap((page) => page.items)
}
