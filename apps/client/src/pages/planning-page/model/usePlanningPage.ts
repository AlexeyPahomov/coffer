import { useEffect, useMemo, useState } from 'react'

import { computeOperationalSummary } from '@/entities/budget/lib/computeOperationalSummary'
import { monthProjectionFromSummary } from '@/entities/budget/lib/monthProjectionFromSummary'
import { formatPlanningPeriodLabel } from '@/entities/budget/lib/periodLabels'
import { filterExpenseCategories } from '@/entities/category/lib/filterExpenseCategories'
import {
  fullReserveMutationArgs,
  unreservePlannedExpenseMutationArgs,
} from '@/entities/planned-expense/lib/fullReserveMutationArgs'
import { usePeriodBudgetCore } from '@/entities/budget/model/usePeriodBudgetCore'
import { usePlannedExpensesQuery } from '@/entities/planned-expense/api/usePlannedExpensesQuery'
import { usePlannedExpenseStatusMutation } from '@/entities/planned-expense/api/usePlannedExpenseStatusMutation'
import { useUnfinishPlannedExpenseMutation } from '@/entities/planned-expense/api/useUnfinishPlannedExpenseMutation'
import { buildPlanningTimelineMonths } from '@/entities/planned-expense/lib/buildPlanningTimelineMonths'
import { resolveAccountingPeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import {
  collectPlannedExpenseSwatchesByPeriodMonth,
  countPlannedExpensesByPeriodMonth,
  filterPlannedExpensesByPeriodMonth,
} from '@/entities/planned-expense/lib/groupPlannedExpensesByPeriodMonth'
import { currentMonthInputValue } from '@/shared/lib/date'

export function usePlanningPage() {
  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)
  const [defaultPeriodMonth, setDefaultPeriodMonth] = useState(
    currentMonthInputValue,
  )
  const periodMonth = pickedPeriodMonth ?? defaultPeriodMonth
  const plannedQuery = usePlannedExpensesQuery()
  const statusMutation = usePlannedExpenseStatusMutation()
  const unfinishMutation = useUnfinishPlannedExpenseMutation()

  const core = usePeriodBudgetCore(periodMonth)
  const allPlanned = plannedQuery.data ?? []

  useEffect(() => {
    if (pickedPeriodMonth !== null || core.incomesQuery.isPending) {
      return
    }

    setDefaultPeriodMonth(resolveAccountingPeriodMonth(core.incomes))
  }, [core.incomes, core.incomesQuery.isPending, pickedPeriodMonth])

  const periodPlanned = useMemo(
    () => filterPlannedExpensesByPeriodMonth(allPlanned, periodMonth),
    [allPlanned, periodMonth],
  )

  const operationalSummary = useMemo(
    () =>
      computeOperationalSummary(
        core.budgetItems,
        core.incomes,
        core.allocations,
        core.expenses,
        periodMonth,
        periodPlanned,
      ),
    [
      core.budgetItems,
      core.incomes,
      core.allocations,
      core.expenses,
      periodMonth,
      periodPlanned,
    ],
  )

  const projection = useMemo(
    () => monthProjectionFromSummary(operationalSummary),
    [operationalSummary],
  )

  const periodLabels = useMemo(() => {
    const months = buildPlanningTimelineMonths(periodMonth)
    return Object.fromEntries(
      months.map((month) => [month, formatPlanningPeriodLabel(month)]),
    )
  }, [periodMonth])

  const itemCounts = useMemo(
    () => countPlannedExpensesByPeriodMonth(allPlanned),
    [allPlanned],
  )
  const itemSwatches = useMemo(
    () => collectPlannedExpenseSwatchesByPeriodMonth(allPlanned),
    [allPlanned],
  )

  const expenseCategories = useMemo(
    () => filterExpenseCategories(core.categories),
    [core.categories],
  )

  return {
    periodMonth,
    setPeriodMonth: (nextPeriodMonth: string) =>
      setPickedPeriodMonth(nextPeriodMonth),
    periodLabel: operationalSummary.periodLabel,
    periodPlanned,
    projection,
    periodLabels,
    itemCounts,
    itemSwatches,
    expenseCategories,
    reserve: (id: string, amount: number) =>
      statusMutation.mutate(fullReserveMutationArgs(id, amount)),
    cancelPlan: (id: string) =>
      statusMutation.mutate({ id, status: 'CANCELLED' }),
    unreserve: (id: string) =>
      statusMutation.mutate(unreservePlannedExpenseMutationArgs(id)),
    unfinish: (id: string) => unfinishMutation.mutate(id),
    pendingStatusMutation: statusMutation.isPending
      ? statusMutation.variables
      : undefined,
    pendingUnfinishId: unfinishMutation.isPending
      ? unfinishMutation.variables
      : undefined,
    incomeTotal: operationalSummary.incomeTotal,
    allocatedTotal: operationalSummary.allocatedTotal,
    isLoading: plannedQuery.isPending || core.isCoreLoading,
  }
}
