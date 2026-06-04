import type { MonthBudgetProjection } from '@/processes/forecasting'

import {
  getLiquidityFlowNodeConfig,
  type LiquidityFlowNodeConfig,
  type LiquidityFlowNodeKind,
} from './liquidityFlowLayout'

export type LiquidityFlowNodeData = LiquidityFlowNodeConfig & {
  amount: number
}

export type LiquidityFlowRailNodeKind = Exclude<LiquidityFlowNodeKind, 'income'>

export type LiquidityFlowRailNodeData = LiquidityFlowNodeConfig & {
  kind: LiquidityFlowRailNodeKind
  amount: number
}

const flowNodeKinds: LiquidityFlowNodeKind[] = [
  'income',
  'pool',
  'planned',
  'reserved',
  'forecast',
]

const railNodeKinds: LiquidityFlowRailNodeKind[] = [
  'pool',
  'planned',
  'reserved',
  'forecast',
]

function liquidityFlowAmounts(
  projection: MonthBudgetProjection,
  expectedIncomeTotal: number,
): Record<LiquidityFlowNodeKind, number> {
  return {
    income: expectedIncomeTotal,
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

export function buildLiquidityFlowNodes(
  projection: MonthBudgetProjection,
  expectedIncomeTotal = 0,
): LiquidityFlowNodeData[] {
  return buildNodes(
    flowNodeKinds,
    liquidityFlowAmounts(projection, expectedIncomeTotal),
  )
}

export function buildLiquidityFlowRailNodes(
  projection: MonthBudgetProjection,
  expectedIncomeTotal = 0,
): LiquidityFlowRailNodeData[] {
  return buildNodes(
    railNodeKinds,
    liquidityFlowAmounts(projection, expectedIncomeTotal),
  )
}
