import type { PeriodLedgerSummary } from '@coffer/shared'

export function isPeriodLedgerSummaryForMonth(
  summary: PeriodLedgerSummary | undefined,
  periodMonth: string,
): summary is PeriodLedgerSummary {
  return summary?.periodMonth === periodMonth
}
