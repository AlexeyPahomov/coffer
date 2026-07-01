export const OUTCOME_HORIZONS = [3, 6, 12] as const

export type OutcomeHorizon = (typeof OUTCOME_HORIZONS)[number]

export const DEFAULT_OUTCOME_HORIZON: OutcomeHorizon = 3

export type PlanningOutcomeMonth = {
  month: string
  label: string
  projectedFree: number
  savingsBalance: number
  /** Сумма дефицита свободного пула в этом месяце (0, если пул неотрицателен). */
  deficit: number
}

export type PlanningOutcome = {
  horizon: OutcomeHorizon
  /** Подпись целевого месяца («через N месяцев»). */
  horizonLabel: string
  poolNow: number
  poolAtHorizon: number
  savingsNow: number
  savingsAtHorizon: number
  hasDeficit: boolean
  firstDeficitMonth: string | null
  months: PlanningOutcomeMonth[]
}
