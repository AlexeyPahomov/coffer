import { useMemo, useState } from 'react'
import type { ForecastMonth, MonthBudgetProjection } from '@/processes/forecasting'

import { formatPlanningPeriodLabel } from '@/entities/budget'
import { resolveEnvelopeForecastInputs } from '@/entities/budget/lib/resolveEnvelopeForecastInputs'
import { filterExpenseCategories } from '@/entities/category/lib/filterExpenseCategories'
import {
  fullReserveMutationArgs,
  unreservePlannedExpenseMutationArgs,
} from '@/entities/planned-expense/lib/fullReserveMutationArgs'
import { useAllocationRulesQuery } from '@/entities/allocation-rule/api/useAllocationRulesQuery'
import { usePlannedExpensesQuery } from '@/entities/planned-expense/api/usePlannedExpensesQuery'
import { usePlannedExpenseStatusMutation } from '@/entities/planned-expense/api/usePlannedExpenseStatusMutation'
import { useUnfinishPlannedExpenseMutation } from '@/entities/planned-expense/api/useUnfinishPlannedExpenseMutation'
import { buildPlanningTimelineMonths } from '@/entities/planned-expense/lib/buildPlanningTimelineMonths'
import {
  collectPlannedExpenseSwatchesByPeriodMonth,
  countPlannedExpensesByPeriodMonth,
  filterPlannedExpensesByPeriodMonth,
} from '@/entities/planned-expense/lib/groupPlannedExpensesByPeriodMonth'
import { currentMonthInputValue } from '@/shared/lib/date'

import { buildPlanningForecast } from '../lib/buildPlanningForecast'
import { buildEnvelopeForecastChain } from '../lib/buildEnvelopeForecast'
import { usePlanningPeriodBudget } from './usePlanningPeriodBudget'

const EMPTY_PLANNED_EXPENSES: readonly [] = []

function forecastMonthToProjection(
  month: ForecastMonth,
): MonthBudgetProjection {
  return {
    available: month.openingBalance,
    spentTotal: 0,
    plannedTotal: month.planned,
    reservedTotal: month.reserved,
    commitmentTotal: month.planned + month.reserved,
    projectedFree: month.projectedFree,
    expectedEnvelopeAllocation: month.expectedEnvelopeAllocation,
  }
}

export function usePlanningPage() {
  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)
  const periodMonth = pickedPeriodMonth ?? currentMonthInputValue()
  const plannedQuery = usePlannedExpensesQuery()
  const allocationRulesQuery = useAllocationRulesQuery()
  const statusMutation = usePlannedExpenseStatusMutation()
  const unfinishMutation = useUnfinishPlannedExpenseMutation()

  const allPlanned = plannedQuery.data ?? EMPTY_PLANNED_EXPENSES

  const periodPlanned = useMemo(
    () => filterPlannedExpensesByPeriodMonth(allPlanned, periodMonth),
    [allPlanned, periodMonth],
  )

  const { core, periodBudget, budgetCycle, isBudgetLoading } =
    usePlanningPeriodBudget(periodMonth, periodPlanned)

  const operationalSummary = periodBudget.operationalSummary

  const timelineMonths = useMemo(
    () => buildPlanningTimelineMonths(periodMonth),
    [periodMonth],
  )
  const forecastMonths = useMemo(
    () => timelineMonths.filter((month) => month >= periodMonth),
    [periodMonth, timelineMonths],
  )
  const forecast = useMemo(
    () =>
      buildPlanningForecast({
        months: forecastMonths,
        incomes: core.incomes,
        plannedExpenses: allPlanned,
        rules: allocationRulesQuery.data ?? [],
        initialAvailable: operationalSummary.available,
      }),
    [
      allPlanned,
      allocationRulesQuery.data,
      core.incomes,
      forecastMonths,
      operationalSummary.available,
    ],
  )
  const forecastMonth = forecast.months.find(
    (month) => month.month === periodMonth,
  )
  const projection = useMemo(
    () =>
      forecastMonth
        ? forecastMonthToProjection(forecastMonth)
        : {
            available: operationalSummary.available,
            spentTotal: 0,
            plannedTotal: operationalSummary.plannedTotal,
            reservedTotal: operationalSummary.reservedTotal,
            commitmentTotal:
              operationalSummary.plannedTotal + operationalSummary.reservedTotal,
            projectedFree: operationalSummary.projectedFree,
          },
    [
      forecastMonth,
      operationalSummary.available,
      operationalSummary.plannedTotal,
      operationalSummary.projectedFree,
      operationalSummary.reservedTotal,
    ],
  )

  const periodLabels = useMemo(() => {
    const months = timelineMonths
    return Object.fromEntries(
      months.map((month) => [month, formatPlanningPeriodLabel(month)]),
    )
  }, [timelineMonths])

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
  const envelopeForecastInputs = useMemo(
    () =>
      resolveEnvelopeForecastInputs({
        periodMonth,
        forecastMonths,
        categories: core.categories,
        allocations: core.allocations,
        expenses: core.expenses,
        incomes: core.incomes,
        periodBudgetItems: periodBudget.allBudgetItems,
        budgetCycle,
      }),
    [
      budgetCycle,
      core.allocations,
      core.categories,
      core.expenses,
      core.incomes,
      forecastMonths,
      periodBudget.allBudgetItems,
      periodMonth,
    ],
  )
  const envelopeForecast = useMemo(
    () =>
      buildEnvelopeForecastChain({
        months: envelopeForecastInputs.months,
        selectedPeriodMonth: periodMonth,
        incomes: core.incomes,
        rules: allocationRulesQuery.data ?? [],
        initialBudgetItems: envelopeForecastInputs.initialBudgetItems,
      }),
    [
      allocationRulesQuery.data,
      core.incomes,
      envelopeForecastInputs,
      periodMonth,
    ],
  )

  return {
    periodMonth,
    setPeriodMonth: (nextPeriodMonth: string) =>
      setPickedPeriodMonth(nextPeriodMonth),
    periodLabel: operationalSummary.periodLabel,
    periodPlanned,
    projection,
    forecast,
    forecastMonth,
    forecastMetadata: forecast.metadata,
    envelopeForecast,
    expectedIncomeTotal: forecastMonth?.income ?? 0,
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
    isLoading:
      plannedQuery.isPending ||
      allocationRulesQuery.isPending ||
      isBudgetLoading,
  }
}
