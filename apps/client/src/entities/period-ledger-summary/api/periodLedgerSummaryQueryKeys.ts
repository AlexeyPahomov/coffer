export const periodLedgerSummaryQueryKeys = {
  all: ['period-ledger-summary'] as const,
  byPeriod: (periodMonth: string) =>
    [...periodLedgerSummaryQueryKeys.all, periodMonth] as const,
}
