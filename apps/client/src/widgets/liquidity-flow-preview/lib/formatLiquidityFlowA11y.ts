import type { MonthBudgetProjection } from '@/processes/forecasting'

import { formatAmount } from '@/shared/lib/format'

import { liquidityFlowNodeLabels } from './liquidityFlowCopy'

export function formatLiquidityFlowA11ySummary(
  projection: MonthBudgetProjection,
  expectedIncomeTotal = 0,
): string {
  return [
    `${liquidityFlowNodeLabels.income}: ${formatAmount(expectedIncomeTotal)}`,
    `${liquidityFlowNodeLabels.pool}: ${formatAmount(projection.available)}`,
    `${liquidityFlowNodeLabels.planned}: ${formatAmount(projection.plannedTotal)}`,
    `${liquidityFlowNodeLabels.reserved}: ${formatAmount(projection.reservedTotal)}`,
    `${liquidityFlowNodeLabels.forecast}: ${formatAmount(projection.projectedFree)}`,
  ].join('. ')
}
