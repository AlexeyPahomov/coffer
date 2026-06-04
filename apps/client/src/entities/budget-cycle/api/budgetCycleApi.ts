import { apiGet } from '@/shared/api/client'
import { DEV_USER_ID } from '@/shared/lib/constants'

import type { BudgetCycleView } from '../model/types'

function buildQuery(asOf?: string): string {
  const q = new URLSearchParams({ user_id: DEV_USER_ID })
  if (asOf) {
    q.set('as_of', asOf)
  }
  return q.toString()
}

export async function fetchCurrentBudgetCycle(
  asOf?: string,
): Promise<BudgetCycleView> {
  return apiGet<BudgetCycleView>(`/budget-cycles/current?${buildQuery(asOf)}`)
}
