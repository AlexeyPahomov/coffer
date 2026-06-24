import { useMemo } from 'react'

import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import {
  useExpensePeriodBudget,
  usePeriodBudgetCore,
} from '@/entities/budget'
import { useCurrentBudgetCycleQuery } from '@/entities/budget-cycle/api/useCurrentBudgetCycleQuery'
import { isBudgetEnvelopeLoading } from '@/entities/budget/lib/isBudgetEnvelopeLoading'
import { currentMonthInputValue } from '@/shared/lib/date'

export function usePlanningPeriodBudget(
  periodMonth: string,
  plannedExpenses: readonly PlannedExpense[],
) {
  const core = usePeriodBudgetCore(periodMonth)
  const budgetCycleQuery = useCurrentBudgetCycleQuery()
  const needsBudgetCycle = periodMonth >= currentMonthInputValue()

  const periodBudget = useExpensePeriodBudget({
    periodMonth,
    categories: core.categories,
    incomes: core.incomes,
    allocations: core.allocations,
    expenses: core.expenses,
    budgetCycle: budgetCycleQuery.data,
    budgetMonthView: core.budgetMonthView,
    ledgerSummary: core.ledgerSummary,
    plannedExpenses,
  })

  const isBudgetLoading = useMemo(
    () =>
      isBudgetEnvelopeLoading({
        categoriesQuery: core.categoriesQuery,
        incomesQuery: core.incomesQuery,
        budgetMonthQuery: core.budgetMonthQuery,
        ledgerSummaryQuery: core.ledgerSummaryQuery,
        trustSnapshots: periodBudget.trustSnapshots,
        hasLedgerSummary: periodBudget.hasLedgerSummary,
        needsLedgerEvents: false,
        useCycleEnvelopes: periodBudget.useCycleEnvelopes,
        budgetCycleQuery: needsBudgetCycle ? budgetCycleQuery : undefined,
      }),
    [
      budgetCycleQuery,
      core.budgetMonthQuery,
      core.categoriesQuery,
      core.incomesQuery,
      core.ledgerSummaryQuery,
      needsBudgetCycle,
      periodBudget.hasLedgerSummary,
      periodBudget.trustSnapshots,
      periodBudget.useCycleEnvelopes,
    ],
  )

  return {
    core,
    periodBudget,
    budgetCycle: budgetCycleQuery.data,
    isBudgetLoading,
  }
}
