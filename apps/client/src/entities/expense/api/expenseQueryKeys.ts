export const expenseQueryKeys = {
  all: ['expenses'] as const,
  list: () => [...expenseQueryKeys.all, 'list'] as const,
  history: (periodMonth: string, categoryId: string) =>
    [...expenseQueryKeys.all, 'history', periodMonth, categoryId] as const,
}

export function expenseQueryKeysHistoryRoot(
  periodMonth?: string,
): readonly string[] {
  return periodMonth
    ? [...expenseQueryKeys.all, 'history', periodMonth]
    : [...expenseQueryKeys.all, 'history']
}
