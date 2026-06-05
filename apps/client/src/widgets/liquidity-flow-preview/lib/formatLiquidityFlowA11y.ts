import type { MonthBudgetProjection } from '@/processes/forecasting'

import { formatAmount } from '@/shared/lib/format'

import { buildLiquidityFlowDetailLines } from './buildLiquidityFlowDetailLines'

export function formatLiquidityFlowA11ySummary(
  projection: MonthBudgetProjection,
  expectedIncomeTotal = 0,
): string {
  return buildLiquidityFlowDetailLines(projection, expectedIncomeTotal)
    .map((line) => `${line.label}: ${formatAmount(line.amount)}`)
    .join('. ')
}
