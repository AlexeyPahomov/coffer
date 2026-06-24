export type QueryPendingState = {
  isPending: boolean
  data: unknown
}

export type BudgetEnvelopeLoadingParams = {
  categoriesQuery: QueryPendingState
  incomesQuery: QueryPendingState
  budgetMonthQuery: QueryPendingState
  ledgerSummaryQuery?: QueryPendingState
  allocationsQuery?: QueryPendingState
  expensesQuery?: QueryPendingState
  budgetCycleQuery?: QueryPendingState
  trustSnapshots: boolean
  hasLedgerSummary: boolean
  needsLedgerEvents: boolean
  useCycleEnvelopes: boolean
}

function isLedgerEventsLoading(
  allocationsQuery: QueryPendingState | undefined,
  expensesQuery: QueryPendingState | undefined,
): boolean {
  return (
    allocationsQuery != null &&
    expensesQuery != null &&
    (allocationsQuery.isPending || expensesQuery.isPending) &&
    (allocationsQuery.data === undefined || expensesQuery.data === undefined)
  )
}

/** Когда ждать данные для отображения конвертов на expense/planning. */
export function isBudgetEnvelopeLoading({
  categoriesQuery,
  incomesQuery,
  budgetMonthQuery,
  ledgerSummaryQuery,
  allocationsQuery,
  expensesQuery,
  budgetCycleQuery,
  trustSnapshots,
  hasLedgerSummary,
  needsLedgerEvents,
  useCycleEnvelopes,
}: BudgetEnvelopeLoadingParams): boolean {
  if (categoriesQuery.isPending || incomesQuery.isPending) {
    return true
  }

  if (
    ledgerSummaryQuery?.isPending &&
    ledgerSummaryQuery.data === undefined &&
    !hasLedgerSummary
  ) {
    return true
  }

  if (useCycleEnvelopes) {
    if (
      budgetCycleQuery?.isPending === true &&
      budgetCycleQuery.data === undefined
    ) {
      return true
    }

    if (needsLedgerEvents && isLedgerEventsLoading(allocationsQuery, expensesQuery)) {
      return true
    }

    return false
  }

  if (budgetMonthQuery.isPending && budgetMonthQuery.data === undefined) {
    return true
  }

  if (needsLedgerEvents && isLedgerEventsLoading(allocationsQuery, expensesQuery)) {
    return true
  }

  if (
    !trustSnapshots &&
    !hasLedgerSummary &&
    isLedgerEventsLoading(allocationsQuery, expensesQuery)
  ) {
    return true
  }

  return false
}
