import type { QueryClient } from '@tanstack/react-query'

import { invalidateBootstrapCache } from '@/entities/bootstrap'
import { invalidateBudgetCycleCache } from '@/entities/budget-cycle/api/invalidateBudgetCycleCache'
import { invalidateBudgetMonthCache } from '@/entities/budget-month/api/invalidateBudgetMonthCache'

export type DerivedBudgetCacheScope = {
  periodMonth?: string
  asOf?: string
  /** Полный refetch bootstrap (дорого — только для крупных изменений). */
  includeBootstrap?: boolean
}

/** Сброс производных срезов бюджета (месяц + доходный цикл). */
export function invalidateDerivedBudgetCaches(
  queryClient: QueryClient,
  scope?: DerivedBudgetCacheScope,
): void {
  invalidateBudgetMonthCache(queryClient, scope)
  invalidateBudgetCycleCache(queryClient, scope)

  if (scope?.includeBootstrap) {
    invalidateBootstrapCache(queryClient)
  }
}
