import type { MonthBudgetProjection } from '@/processes/forecasting'

import {
  getLiquidityFlowNodeConfig,
  type LiquidityFlowNodeConfig,
  type LiquidityFlowNodeKind,
} from './liquidityFlowLayout'

export type LiquidityFlowRailNodeKind = Exclude<
  LiquidityFlowNodeKind,
  'income' | 'envelopeAllocation'
>

export type LiquidityFlowRailNodeData = LiquidityFlowNodeConfig & {
  kind: LiquidityFlowRailNodeKind
  amount: number
}

function liquidityFlowAmounts(
  projection: MonthBudgetProjection,
  expectedIncomeTotal: number,
): Record<LiquidityFlowNodeKind, number> {
  return {
    income: expectedIncomeTotal,
    envelopeAllocation: projection.expectedEnvelopeAllocation ?? 0,
    pool: projection.available,
    planned: projection.plannedTotal,
    reserved: projection.reservedTotal,
    forecast: projection.projectedFree,
  }
}

function buildNodes<K extends LiquidityFlowNodeKind>(
  kinds: readonly K[],
  amounts: Record<LiquidityFlowNodeKind, number>,
): Array<LiquidityFlowNodeConfig & { kind: K; amount: number }> {
  return kinds.map((kind) => {
    const config = getLiquidityFlowNodeConfig(kind)
    return {
      ...config,
      kind,
      amount: amounts[kind],
    }
  })
}

export function buildLiquidityFlowRailNodes(
  projection: MonthBudgetProjection,
  expectedIncomeTotal = 0,
): LiquidityFlowRailNodeData[] {
  const amounts = liquidityFlowAmounts(projection, expectedIncomeTotal)
  return buildNodes(
    ['pool', 'planned', 'reserved', 'forecast'] as const,
    amounts,
  )
}
