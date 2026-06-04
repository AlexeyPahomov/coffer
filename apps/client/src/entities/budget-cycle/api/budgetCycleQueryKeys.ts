export const budgetCycleQueryKeys = {
  all: ['budget-cycle'] as const,
  current: (asOf?: string) =>
    [...budgetCycleQueryKeys.all, 'current', asOf ?? 'today'] as const,
}
