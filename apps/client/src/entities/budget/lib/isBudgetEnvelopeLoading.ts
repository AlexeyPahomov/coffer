type QueryPendingState = {
  isPending: boolean
  data: unknown
}

export type BudgetEnvelopeLoadingParams = {
  categoriesQuery: QueryPendingState
  incomesQuery: QueryPendingState
  budgetMonthQuery: QueryPendingState
  allocationsQuery: QueryPendingState
  expensesQuery: QueryPendingState
  budgetCycleQuery?: QueryPendingState
  trustSnapshots: boolean
  useCycleEnvelopes: boolean
}

/** Когда ждать данные для отображения конвертов на expense/planning. */
export function isBudgetEnvelopeLoading({
  categoriesQuery,
  incomesQuery,
  budgetMonthQuery,
  allocationsQuery,
  expensesQuery,
  budgetCycleQuery,
  trustSnapshots,
  useCycleEnvelopes,
}: BudgetEnvelopeLoadingParams): boolean {
  if (categoriesQuery.isPending || incomesQuery.isPending) {
    return true
  }

  if (useCycleEnvelopes) {
    return (
      budgetCycleQuery?.isPending === true &&
      budgetCycleQuery.data === undefined
    )
  }

  if (budgetMonthQuery.isPending && budgetMonthQuery.data === undefined) {
    return true
  }

  if (
    !trustSnapshots &&
    (allocationsQuery.isPending || expensesQuery.isPending)
  ) {
    return true
  }

  return false
}
