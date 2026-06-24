import { useBudgetMonthQuery } from '@/entities/budget-month/api/useBudgetMonthQuery'
import { isPeriodLedgerSummaryForMonth } from '@/entities/period-ledger-summary/lib/isPeriodLedgerSummaryForMonth'
import { usePeriodLedgerSummaryQuery } from '@/entities/period-ledger-summary/api/usePeriodLedgerSummaryQuery'

/** Срез budget-month + period ledger summary для выбранного учётного месяца. */
export function useBudgetPeriodQueries(periodMonth: string) {
  const budgetMonthQuery = useBudgetMonthQuery(periodMonth)
  const ledgerSummaryQuery = usePeriodLedgerSummaryQuery(periodMonth)
  const ledgerSummary = ledgerSummaryQuery.data
  const hasLedgerSummary = isPeriodLedgerSummaryForMonth(
    ledgerSummary,
    periodMonth,
  )

  return {
    budgetMonthQuery,
    ledgerSummaryQuery,
    budgetMonthView: budgetMonthQuery.data,
    ledgerSummary,
    hasLedgerSummary,
  }
}
