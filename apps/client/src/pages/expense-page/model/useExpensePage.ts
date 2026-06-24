import { useEffect, useMemo, useState } from 'react'

import {
  shouldUseCycleEnvelopes,
  toCurrentBudgetSummaryView,
  useActiveCycleBudgetCore,
  useExpensePeriodBudget,
} from '@/entities/budget'
import { isBudgetEnvelopeLoading } from '@/entities/budget/lib/isBudgetEnvelopeLoading'
import { useBudgetLedgerEventsQuery } from '@/entities/budget/model/useBudgetLedgerEventsQuery'
import { usePrefetchBudgetMonth } from '@/entities/budget-month/api/usePrefetchBudgetMonth'
import { usePrefetchPeriodLedgerSummary } from '@/entities/period-ledger-summary'
import { filterExpenseCategories } from '@/entities/category/lib/filterExpenseCategories'
import { currentMonthInputValue } from '@/shared/lib/date'

export function useExpensePage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )

  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)
  const periodMonth = pickedPeriodMonth ?? currentMonthInputValue()

  usePrefetchBudgetMonth(periodMonth)
  usePrefetchPeriodLedgerSummary(periodMonth)

  const core = useActiveCycleBudgetCore(periodMonth)

  const useCycleEnvelopes = shouldUseCycleEnvelopes(
    periodMonth,
    currentMonthInputValue(),
    core.budgetCycle,
  )
  const needsCycleLedgerEvents = useCycleEnvelopes && !core.hasLedgerSummary
  const cycleLedgerEvents = useBudgetLedgerEventsQuery(needsCycleLedgerEvents)

  const periodBudget = useExpensePeriodBudget({
    periodMonth,
    categories: core.categories,
    incomes: core.incomes,
    allocations: needsCycleLedgerEvents
      ? cycleLedgerEvents.allocations
      : core.allocations,
    expenses: needsCycleLedgerEvents
      ? cycleLedgerEvents.expenses
      : core.expenses,
    budgetCycle: core.budgetCycle,
    budgetMonthView: core.budgetMonthView,
    ledgerSummary: core.ledgerSummary,
  })

  const expenseCategories = useMemo(
    () => filterExpenseCategories(core.categories),
    [core.categories],
  )

  const budgetItems = periodBudget.budgetItems

  useEffect(() => {
    if (
      selectedCategoryId == null ||
      budgetItems.some((item) => item.category.id === selectedCategoryId)
    ) {
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setSelectedCategoryId(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [budgetItems, selectedCategoryId])

  const currentBudgetView = useMemo(
    () =>
      periodBudget.operationalSummary
        ? toCurrentBudgetSummaryView(periodBudget.operationalSummary)
        : null,
    [periodBudget.operationalSummary],
  )

  const isBudgetPending = isBudgetEnvelopeLoading({
    categoriesQuery: core.categoriesQuery,
    incomesQuery: core.incomesQuery,
    budgetMonthQuery: core.budgetMonthQuery,
    ledgerSummaryQuery: core.ledgerSummaryQuery,
    allocationsQuery: needsCycleLedgerEvents
      ? cycleLedgerEvents.allocationsQuery
      : undefined,
    expensesQuery: needsCycleLedgerEvents
      ? cycleLedgerEvents.expensesQuery
      : undefined,
    budgetCycleQuery: core.budgetCycleQuery,
    trustSnapshots: periodBudget.trustSnapshots,
    hasLedgerSummary: periodBudget.hasLedgerSummary,
    needsLedgerEvents: needsCycleLedgerEvents,
    useCycleEnvelopes,
  })

  const isBudgetError =
    core.categoriesQuery.isError ||
    core.incomesQuery.isError ||
    (!useCycleEnvelopes && core.budgetMonthQuery.isError) ||
    core.ledgerSummaryQuery.isError ||
    (needsCycleLedgerEvents &&
      (cycleLedgerEvents.allocationsQuery.isError ||
        cycleLedgerEvents.expensesQuery.isError)) ||
    (useCycleEnvelopes && core.budgetCycleQuery.isError)

  const budgetError =
    core.categoriesQuery.error ??
    core.incomesQuery.error ??
    (!useCycleEnvelopes ? core.budgetMonthQuery.error : null) ??
    core.ledgerSummaryQuery.error ??
    (needsCycleLedgerEvents
      ? (cycleLedgerEvents.allocationsQuery.error ??
        cycleLedgerEvents.expensesQuery.error)
      : null) ??
    (useCycleEnvelopes ? core.budgetCycleQuery.error : null)

  const isBudgetFetching =
    core.categoriesQuery.isFetching ||
    core.incomesQuery.isFetching ||
    (!useCycleEnvelopes && core.budgetMonthQuery.isFetching) ||
    core.ledgerSummaryQuery.isFetching ||
    (needsCycleLedgerEvents &&
      (cycleLedgerEvents.allocationsQuery.isFetching ||
        cycleLedgerEvents.expensesQuery.isFetching)) ||
    (useCycleEnvelopes && core.budgetCycleQuery.isFetching)

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    periodMonth,
    setPeriodMonth: (nextPeriodMonth: string) =>
      setPickedPeriodMonth(nextPeriodMonth),
    expenseCategories,
    incomes: core.incomes,
    allocations: core.allocations,
    allBudgetItems: periodBudget.allBudgetItems,
    budgetItems,
    currentBudgetView,
    categories: core.categories,
    isBudgetPending,
    isBudgetError,
    budgetError,
    isBudgetFetching,
    categoriesQuery: core.categoriesQuery,
    incomesQuery: core.incomesQuery,
    budgetCycleQuery: core.budgetCycleQuery,
  }
}
