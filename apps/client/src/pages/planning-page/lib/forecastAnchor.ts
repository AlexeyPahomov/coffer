import { getNextPeriodMonth, type PeriodLedgerSummary } from '@coffer/shared'

import { computeAvailableFromLedgerSummary } from '@/entities/budget/lib/computeOperationalSummary'
import { isPeriodLedgerSummaryForMonth } from '@/entities/period-ledger-summary'

/**
 * Месяц, от факта которого стартует цепочка прогноза. Факт есть только «на сейчас»:
 * сводка будущего месяца лишь повторяет текущий остаток, поэтому для будущих
 * месяцев якорь — текущий календарный. Прошлый и текущий месяц — от своего факта.
 */
export function resolveForecastAnchorMonth(
  periodMonth: string,
  currentCalendarMonth: string,
): string {
  return periodMonth > currentCalendarMonth ? currentCalendarMonth : periodMonth
}

/** Месяцы от якоря (включительно) до periodMonth (не включая). */
export function buildForecastLeadInMonths(
  anchorMonth: string,
  periodMonth: string,
): string[] {
  const months: string[] = []
  let current: string | undefined = anchorMonth

  while (current && current < periodMonth) {
    months.push(current)
    current = getNextPeriodMonth(current)
  }

  return months
}

export type ForecastAnchorSummary = {
  available: number
  inReserve: number
}

/** Факт якоря из серверной сводки — то же, что даёт сводка страницы при загруженной сводке. */
export function resolveForecastAnchorSummary(
  ledgerSummary: PeriodLedgerSummary | undefined,
  anchorMonth: string,
): ForecastAnchorSummary | null {
  if (!isPeriodLedgerSummaryForMonth(ledgerSummary, anchorMonth)) {
    return null
  }

  return {
    available: computeAvailableFromLedgerSummary(
      ledgerSummary,
      ledgerSummary.openingFreePool,
    ),
    inReserve: ledgerSummary.savingsReserveBalance,
  }
}
