import { useMemo, useState } from 'react'
import type { ForecastMonth, MonthBudgetProjection } from '@/processes/forecasting'

import { formatPlanningPeriodLabel } from '@/entities/budget'
import { useBudgetLedgerEventsQuery } from '@/entities/budget/model/useBudgetLedgerEventsQuery'
import { usePrefetchBudgetMonth } from '@/entities/budget-month/api/usePrefetchBudgetMonth'
import { usePrefetchPeriodLedgerSummary } from '@/entities/period-ledger-summary'
import { resolveEnvelopeForecastInputs } from '@/entities/budget/lib/resolveEnvelopeForecastInputs'
import { filterExpenseCategories } from '@/entities/category/lib/filterExpenseCategories'
import { isSavingsCategory } from '@/entities/category/lib/categoryKind'
import { buildProjectedIncomes } from '@/entities/income/lib/projectRecurringIncome'
import {
  DEFAULT_OUTCOME_HORIZON,
  type OutcomeHorizon,
  type PlanningOutcome,
} from '@/widgets/planning-outcome-forecast'
import {
  fullReserveMutationArgs,
  unreservePlannedExpenseMutationArgs,
} from '@/entities/planned-expense/lib/fullReserveMutationArgs'
import { useAllocationRulesQuery } from '@/entities/allocation-rule/api/useAllocationRulesQuery'
import { usePlannedExpensesQuery } from '@/entities/planned-expense/api/usePlannedExpensesQuery'
import { useDeletePlannedExpenseMutation } from '@/entities/planned-expense/api/useDeletePlannedExpenseMutation'
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
import { buildForecastHorizonMonths } from '../lib/buildForecastHorizonMonths'
import { buildSavingsTrajectory } from '../lib/buildSavingsTrajectory'
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
  const [outcomeHorizon, setOutcomeHorizon] = useState<OutcomeHorizon>(
    DEFAULT_OUTCOME_HORIZON,
  )
  const currentCalendarMonth = currentMonthInputValue()
  const periodMonth = pickedPeriodMonth ?? currentCalendarMonth
  usePrefetchBudgetMonth(periodMonth)
  usePrefetchPeriodLedgerSummary(periodMonth)
  const ledgerEvents = useBudgetLedgerEventsQuery(true)
  const plannedQuery = usePlannedExpensesQuery()
  const allocationRulesQuery = useAllocationRulesQuery()
  const statusMutation = usePlannedExpenseStatusMutation()
  const deletePlanMutation = useDeletePlannedExpenseMutation()
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
        allocations: ledgerEvents.allocations,
        expenses: ledgerEvents.expenses,
        incomes: core.incomes,
        periodBudgetItems: periodBudget.allBudgetItems,
        budgetCycle,
      }),
    [
      budgetCycle,
      ledgerEvents.allocations,
      core.categories,
      ledgerEvents.expenses,
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
        savingsReserveBalance: operationalSummary.inReserve,
        plannedExpenses: allPlanned,
        expenseCategories,
      }),
    [
      allPlanned,
      allocationRulesQuery.data,
      core.incomes,
      envelopeForecastInputs,
      expenseCategories,
      operationalSummary.inReserve,
      periodMonth,
    ],
  )

  const savingsCategoryIds = useMemo(
    () =>
      new Set(
        core.categories
          .filter((category) => isSavingsCategory(category.type))
          .map((category) => category.id),
      ),
    [core.categories],
  )

  const outcome = useMemo<PlanningOutcome>(() => {
    const horizonMonths = buildForecastHorizonMonths(periodMonth, outcomeHorizon)
    const projectedIncomes = buildProjectedIncomes(
      horizonMonths,
      core.incomes,
      currentCalendarMonth,
    )
    const rules = allocationRulesQuery.data ?? []

    const outcomeForecast = buildPlanningForecast({
      months: horizonMonths,
      incomes: projectedIncomes,
      plannedExpenses: allPlanned,
      rules,
      initialAvailable: operationalSummary.available,
    })
    const savingsTrajectory = buildSavingsTrajectory({
      months: horizonMonths,
      incomes: projectedIncomes,
      rules,
      plannedExpenses: allPlanned,
      savingsCategoryIds,
      initialBalance: operationalSummary.inReserve,
    })

    const months = outcomeForecast.months.map((forecastMonthPoint, index) => ({
      month: forecastMonthPoint.month,
      label: formatPlanningPeriodLabel(forecastMonthPoint.month),
      projectedFree: forecastMonthPoint.projectedFree,
      savingsBalance: savingsTrajectory[index]?.balance ?? 0,
      deficit: forecastMonthPoint.deficit,
    }))

    return {
      horizon: outcomeHorizon,
      hasDeficit: outcomeForecast.metadata.hasDeficit,
      months,
    }
  }, [
    allPlanned,
    allocationRulesQuery.data,
    core.incomes,
    currentCalendarMonth,
    operationalSummary.available,
    operationalSummary.inReserve,
    outcomeHorizon,
    periodMonth,
    savingsCategoryIds,
  ])

  return {
    periodMonth,
    setPeriodMonth: (nextPeriodMonth: string) =>
      setPickedPeriodMonth(nextPeriodMonth),
    outcome,
    setOutcomeHorizon,
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
    deletePlan: (id: string) => deletePlanMutation.mutate(id),
    unreserve: (id: string) =>
      statusMutation.mutate(unreservePlannedExpenseMutationArgs(id)),
    unfinish: (id: string) => unfinishMutation.mutate(id),
    pendingStatusMutation: statusMutation.isPending
      ? statusMutation.variables
      : undefined,
    pendingDeletePlanId: deletePlanMutation.isPending
      ? deletePlanMutation.variables
      : undefined,
    pendingUnfinishId: unfinishMutation.isPending
      ? unfinishMutation.variables
      : undefined,
    isPlansLoading:
      plannedQuery.isPending && plannedQuery.data === undefined,
    isRulesLoading:
      allocationRulesQuery.isPending &&
      allocationRulesQuery.data === undefined,
    isBudgetLoading,
    isForecastLoading:
      isBudgetLoading ||
      ledgerEvents.isLedgerLoading ||
      (allocationRulesQuery.isPending &&
        allocationRulesQuery.data === undefined),
    isLoading:
      (plannedQuery.isPending && plannedQuery.data === undefined) ||
      (allocationRulesQuery.isPending &&
        allocationRulesQuery.data === undefined) ||
      isBudgetLoading,
  }
}
