import type { PlannedEvent } from '@/entities/planned-event/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import type {
  OutcomeHorizon,
  PlanningOutcomeMonth,
} from '@/widgets/planning-outcome-forecast'

/** Горизонт сводки по умолчанию — полгода вперёд. */
export const DEFAULT_SUMMARY_HORIZON: OutcomeHorizon = 6

/** Крупная трата — от этой доли среднего месячного дохода на горизонте. */
export const BIG_PLAN_INCOME_SHARE = 0.2

export type PlanFundingSources = {
  savings: number
  pool: number
  envelope: number
}

export type PlanningSummaryMonth = {
  month: string
  label: string
  total: number
  sources: PlanFundingSources
  /** Планы месяца, крупные первыми. */
  plans: PlannedExpense[]
  deficit: number
  savingsBalance: number
}

export type PlanningSummaryEvent = {
  event: PlannedEvent
  /** Все предстоящие планы события (и за горизонтом), по дате. */
  plans: PlannedExpense[]
  total: number
  savingsTotal: number
  /** Сумма планов события внутри горизонта. */
  horizonTotal: number
  /** null — у события нет предстоящих планов. */
  from: string | null
  to: string | null
}

export type PlanningSummary = {
  months: PlanningSummaryMonth[]
  total: number
  sources: PlanFundingSources
  bigPlanThreshold: number
  bigPlans: PlannedExpense[]
  bigTotal: number
  /** Источники денег каждого плана горизонта. */
  planSources: ReadonlyMap<string, PlanFundingSources>
  peakMonth: PlanningSummaryMonth | null
  deficitMonths: PlanningSummaryMonth[]
  /** Месяц минимума накоплений — только если они проседают ниже уже достигнутого. */
  lowestSavingsMonth: PlanningSummaryMonth | null
  events: PlanningSummaryEvent[]
}

type BuildPlanningSummaryInput = {
  outcomeMonths: readonly PlanningOutcomeMonth[]
  plannedExpenses: readonly PlannedExpense[]
  events: readonly PlannedEvent[]
  savingsCategoryIds: ReadonlySet<string>
  /** Накопления на сейчас — точка отсчёта просадки. */
  initialSavingsBalance: number
}

export const EMPTY_FUNDING_SOURCES: PlanFundingSources = {
  savings: 0,
  pool: 0,
  envelope: 0,
}

/** Предстоящие планы: проведённые уже стали расходами, отменённые — не случатся. */
export function isUpcomingPlan(plan: PlannedExpense): boolean {
  return plan.status === 'PLANNED' || plan.status === 'RESERVED'
}

/**
 * Откуда возьмутся деньги: доля накоплений, остальное — конверт категории или
 * свободный пул. План на savings-конверт целиком идёт из накоплений.
 */
export function planFundingSources(
  plan: PlannedExpense,
  savingsCategoryIds: ReadonlySet<string>,
): PlanFundingSources {
  const savingsShare = plan.savings_category_id
    ? Math.min(Math.max(0, plan.savings_amount), plan.amount)
    : 0
  const rest = plan.amount - savingsShare
  if (plan.category_id && savingsCategoryIds.has(plan.category_id)) {
    return { savings: plan.amount, pool: 0, envelope: 0 }
  }
  return {
    savings: savingsShare,
    pool: plan.category_id ? 0 : rest,
    envelope: plan.category_id ? rest : 0,
  }
}

function addSources(
  a: PlanFundingSources,
  b: PlanFundingSources,
): PlanFundingSources {
  return {
    savings: a.savings + b.savings,
    pool: a.pool + b.pool,
    envelope: a.envelope + b.envelope,
  }
}

function sumAmounts(plans: readonly PlannedExpense[]): number {
  return plans.reduce((sum, plan) => sum + plan.amount, 0)
}

function planEndDate(plan: PlannedExpense): string {
  return plan.planned_date_end ?? plan.planned_date
}

export function buildPlanningSummary({
  outcomeMonths,
  plannedExpenses,
  events,
  savingsCategoryIds,
  initialSavingsBalance,
}: BuildPlanningSummaryInput): PlanningSummary {
  const upcoming = plannedExpenses.filter(isUpcomingPlan)
  const planSources = new Map<string, PlanFundingSources>()

  const months = outcomeMonths.map((point): PlanningSummaryMonth => {
    const plans = upcoming
      .filter((plan) => plan.period_month === point.month)
      .sort((a, b) => b.amount - a.amount)
    const sources = plans.map((plan) => {
      const planSource = planFundingSources(plan, savingsCategoryIds)
      planSources.set(plan.id, planSource)
      return planSource
    })
    return {
      month: point.month,
      label: point.label,
      total: sumAmounts(plans),
      sources: sources.reduce(addSources, EMPTY_FUNDING_SOURCES),
      plans,
      deficit: point.deficit,
      savingsBalance: point.savingsBalance,
    }
  })

  const horizonPlans = months.flatMap((month) => month.plans)
  const horizonPlanIds = new Set(horizonPlans.map((plan) => plan.id))
  const averageIncome =
    outcomeMonths.length > 0
      ? outcomeMonths.reduce((sum, point) => sum + point.income, 0) /
        outcomeMonths.length
      : 0
  const bigPlanThreshold = averageIncome * BIG_PLAN_INCOME_SHARE
  const bigPlans = horizonPlans
    .filter((plan) => bigPlanThreshold > 0 && plan.amount >= bigPlanThreshold)
    .sort((a, b) => b.amount - a.amount)

  const peakMonth = months.reduce<PlanningSummaryMonth | null>(
    (peak, month) =>
      month.total > 0 && (!peak || month.total > peak.total) ? month : peak,
    null,
  )
  let savingsPeak = initialSavingsBalance
  let lowestSavingsMonth: PlanningSummaryMonth | null = null
  for (const month of months) {
    if (
      month.savingsBalance < savingsPeak &&
      (!lowestSavingsMonth ||
        month.savingsBalance < lowestSavingsMonth.savingsBalance)
    ) {
      lowestSavingsMonth = month
    }
    savingsPeak = Math.max(savingsPeak, month.savingsBalance)
  }

  const firstMonth = months[0]?.month ?? ''
  const summaryEvents = events
    .map((event): PlanningSummaryEvent => {
      const plans = upcoming
        .filter(
          (plan) => plan.event_id === event.id && plan.period_month >= firstMonth,
        )
        .sort((a, b) => a.planned_date.localeCompare(b.planned_date))
      const horizonEventPlans = plans.filter((plan) =>
        horizonPlanIds.has(plan.id),
      )
      return {
        event,
        plans,
        total: sumAmounts(plans),
        savingsTotal: plans.reduce(
          (sum, plan) =>
            sum + planFundingSources(plan, savingsCategoryIds).savings,
          0,
        ),
        horizonTotal: sumAmounts(horizonEventPlans),
        from: plans[0]?.planned_date ?? null,
        to: plans.map(planEndDate).sort().at(-1) ?? null,
      }
    })
    .sort((a, b) => b.total - a.total)

  return {
    months,
    total: sumAmounts(horizonPlans),
    sources: months
      .map((month) => month.sources)
      .reduce(addSources, EMPTY_FUNDING_SOURCES),
    bigPlanThreshold,
    bigPlans,
    bigTotal: sumAmounts(bigPlans),
    planSources,
    peakMonth,
    deficitMonths: months.filter((month) => month.deficit > 0),
    lowestSavingsMonth,
    events: summaryEvents,
  }
}
