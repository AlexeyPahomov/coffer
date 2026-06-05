import type { MonthBudgetProjection } from '@/processes/forecasting'

import {
  liquidityFlowEnvelopeAllocationDetailLabel,
  liquidityFlowIncomeDetailLabel,
  liquidityFlowNodeLabels,
} from './liquidityFlowCopy'

export type LiquidityFlowDetailLine = {
  label: string
  amount: number
  sign?: '+' | '−' | '='
}

export function buildLiquidityFlowDetailLines(
  projection: MonthBudgetProjection,
  expectedIncomeTotal: number,
): LiquidityFlowDetailLine[] {
  const optionalLines: LiquidityFlowDetailLine[] = []

  if (expectedIncomeTotal > 0) {
    optionalLines.push({
      label: liquidityFlowIncomeDetailLabel,
      amount: expectedIncomeTotal,
      sign: '+',
    })
  }

  const envelopeAllocation = projection.expectedEnvelopeAllocation ?? 0
  if (envelopeAllocation > 0) {
    optionalLines.push({
      label: liquidityFlowEnvelopeAllocationDetailLabel,
      amount: envelopeAllocation,
      sign: '−',
    })
  }

  return [
    ...optionalLines,
    {
      label: liquidityFlowNodeLabels.pool,
      amount: projection.available,
      sign: '+',
    },
    {
      label: liquidityFlowNodeLabels.planned,
      amount: projection.plannedTotal,
      sign: '−',
    },
    {
      label: liquidityFlowNodeLabels.reserved,
      amount: projection.reservedTotal,
      sign: '−',
    },
    {
      label: liquidityFlowNodeLabels.forecast,
      amount: projection.projectedFree,
      sign: '=',
    },
  ]
}
