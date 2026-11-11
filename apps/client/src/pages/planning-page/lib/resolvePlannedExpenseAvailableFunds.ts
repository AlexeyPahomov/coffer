import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import type { PlannedExpenseAvailableFunds } from '@/features/create-planned-expense/model/types'

import { buildForecastHorizonMonths } from './buildForecastHorizonMonths'
import { buildPlanningForecast } from './buildPlanningForecast'
import { buildSavingsTrajectory } from './buildSavingsTrajectory'
import { buildForecastLeadInMonths } from './forecastAnchor'

type ResolvePlannedExpenseAvailableFundsInput = {
  periodMonth: string
  anchorMonth: string
  horizon: number
  /** Прогнозные доходы, покрывающие lead-in и горизонт от periodMonth. */
  incomes: readonly Income[]
  rules: readonly AllocationRule[]
  plannedExpenses: readonly PlannedExpense[]
  /** Редактируемый план не должен занимать сам у себя. */
  excludePlanId: string | null
  savingsCategoryIds: ReadonlySet<string>
  initialAvailable: number
  initialSavings: number
}

/**
 * Сколько можно взять в periodMonth, не уйдя в минус ни в одном месяце горизонта:
 * разовая трата сдвигает на свою сумму все последующие месяцы цепочки,
 * поэтому доступно — минимум по горизонту, а не остаток самого месяца.
 */
export function resolvePlannedExpenseAvailableFunds({
  periodMonth,
  anchorMonth,
  horizon,
  incomes,
  rules,
  plannedExpenses,
  excludePlanId,
  savingsCategoryIds,
  initialAvailable,
  initialSavings,
}: ResolvePlannedExpenseAvailableFundsInput): PlannedExpenseAvailableFunds | null {
  if (periodMonth < anchorMonth) {
    return null
  }

  const months = buildForecastHorizonMonths(periodMonth, horizon)
  const leadInMonths = buildForecastLeadInMonths(anchorMonth, periodMonth)
  const otherPlans = plannedExpenses.filter((plan) => plan.id !== excludePlanId)

  const forecast = buildPlanningForecast({
    months,
    leadInMonths,
    incomes,
    plannedExpenses: otherPlans,
    rules,
    initialAvailable,
  })
  const savings = buildSavingsTrajectory({
    months,
    leadInMonths,
    incomes,
    rules,
    plannedExpenses: otherPlans,
    savingsCategoryIds,
    initialBalance: initialSavings,
  })

  return {
    pool: Math.min(...forecast.months.map((month) => month.projectedFree)),
    savings: Math.min(...savings.map((point) => point.balance)),
  }
}
