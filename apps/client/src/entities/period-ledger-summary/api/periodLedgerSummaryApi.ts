import type { PeriodLedgerSummary } from '../model/types'
import { apiGet } from '@/shared/api/client'
import { DEV_USER_ID } from '@/shared/lib/constants'

export async function fetchPeriodLedgerSummary(
  periodMonth: string,
): Promise<PeriodLedgerSummary> {
  const q = new URLSearchParams({ user_id: DEV_USER_ID })
  return apiGet<PeriodLedgerSummary>(
    `/budget-ledger-summary/${encodeURIComponent(periodMonth)}?${q}`,
  )
}
