import type { MonthBudgetProjection } from '@/processes/forecasting'

export type LiquidityFlowDataProps = {
  projection: MonthBudgetProjection
  /** Ожидаемые доходы выбранного месяца (первая ступень прогноза). */
  expectedIncomeTotal?: number
}
