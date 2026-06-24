import { useAllAllocationsQuery } from '@/entities/allocation/api/useAllAllocationsQuery'
import { useExpensesQuery } from '@/entities/expense/api/useExpensesQuery'

/** Полный ledger events — только для envelope forecast на planning. */
export function useBudgetLedgerEventsQuery(enabled: boolean) {
  const allocationsQuery = useAllAllocationsQuery({ enabled })
  const expensesQuery = useExpensesQuery({ enabled })

  return {
    allocations: allocationsQuery.data ?? [],
    expenses: expensesQuery.data ?? [],
    allocationsQuery,
    expensesQuery,
    isLedgerLoading:
      enabled &&
      (allocationsQuery.isPending || expensesQuery.isPending) &&
      (allocationsQuery.data === undefined ||
        expensesQuery.data === undefined),
  }
}
