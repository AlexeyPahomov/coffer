import type { QueryClient } from '@tanstack/react-query'

import { invalidateBudgetCycleCache } from '@/entities/budget-cycle/api/invalidateBudgetCycleCache'
import { invalidateBudgetMonthCache } from '@/entities/budget-month/api/invalidateBudgetMonthCache'

/** Сброс производных срезов бюджета (месяц + доходный цикл). */
export function invalidateDerivedBudgetCaches(
  queryClient: QueryClient,
): void {
  invalidateBudgetMonthCache(queryClient)
  invalidateBudgetCycleCache(queryClient)
}
