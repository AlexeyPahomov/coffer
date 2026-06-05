import { BUDGET_METRIC_LABELS } from '@/entities/budget'

export type LiquidityFlowNodeKind =
  | 'income'
  | 'envelopeAllocation'
  | 'pool'
  | 'planned'
  | 'reserved'
  | 'forecast'

export const liquidityFlowNodeLabels: Record<LiquidityFlowNodeKind, string> = {
  income: BUDGET_METRIC_LABELS.expectedIncome,
  envelopeAllocation: BUDGET_METRIC_LABELS.expectedEnvelopeAllocation,
  pool: BUDGET_METRIC_LABELS.poolAvailableNow,
  planned: BUDGET_METRIC_LABELS.planned,
  reserved: BUDGET_METRIC_LABELS.reserved,
  forecast: BUDGET_METRIC_LABELS.forecastRemainder,
}

/** Короткие подписи для компактного mobile rail. */
export const liquidityFlowRailLabels: Record<
  Exclude<LiquidityFlowNodeKind, 'income' | 'envelopeAllocation'>,
  string
> = {
  pool: liquidityFlowNodeLabels.pool,
  planned: 'План',
  reserved: liquidityFlowNodeLabels.reserved,
  forecast: liquidityFlowNodeLabels.forecast,
}

export const liquidityFlowIncomeDetailLabel = 'Ожидаемые доходы'
export const liquidityFlowEnvelopeAllocationDetailLabel =
  'Распределение по конвертам'
