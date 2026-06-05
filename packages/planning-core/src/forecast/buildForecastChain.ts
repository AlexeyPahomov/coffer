import { collectForecastChainMetadata } from './collectForecastChainMetadata.js'
import { projectForecastMonth } from './projectForecastMonth.js'
import type {
  BuildForecastChainInput,
  ForecastChainResult,
  ForecastMonth,
} from './types.js'

/**
 * Последовательная цепочка ликвидности (cashflow forecasting).
 *
 * month[n + 1].openingBalance = month[n].projectedFree
 * month[n].available = opening + income − envelopeAllocation + carryOver + liquidityAdjustment
 *
 * Не использовать независимый map(projectMonthBudget) по месяцам.
 */
export function buildForecastChain(
  input: BuildForecastChainInput,
): ForecastChainResult {
  const months: ForecastMonth[] = []
  let openingBalance = input.initialOpening ?? 0

  for (const monthInput of input.months) {
    const result = projectForecastMonth(monthInput, openingBalance)
    months.push(result.month)
    openingBalance = result.closingLiquidity
  }

  return {
    months,
    metadata: collectForecastChainMetadata(months),
  }
}
