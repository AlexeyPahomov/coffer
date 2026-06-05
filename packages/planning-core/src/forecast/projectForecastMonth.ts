import { projectMonthBudget } from '../projection/projectMonthBudget.js'
import { sumPlannedExpenseCommitments } from '../projection/sumPlannedExpenseCommitments.js'
import { detectForecastWarnings } from './detectForecastWarnings.js'
import { computeForecastDeficit, computeLiquidityAvailable } from './liquidity.js'
import type { ForecastChainMonthInput, ForecastMonth } from './types.js'

export type ProjectForecastMonthResult = {
  month: ForecastMonth
  /** Ликвидность для opening следующего месяца (= projectedFree). */
  closingLiquidity: number
}

export function projectForecastMonth(
  monthInput: ForecastChainMonthInput,
  openingBalance: number,
): ProjectForecastMonthResult {
  const income = monthInput.income
  const expectedEnvelopeAllocation =
    monthInput.expectedEnvelopeAllocation ?? 0
  const carryOver = monthInput.carryOver ?? 0
  const liquidityAdjustment = monthInput.liquidityAdjustment ?? 0
  const available =
    computeLiquidityAvailable({
      openingBalance,
      income,
      carryOver,
      liquidityAdjustment,
    }) - expectedEnvelopeAllocation

  const commitments = sumPlannedExpenseCommitments(monthInput.commitmentRows)
  const projection = projectMonthBudget({
    available,
    spentTotal: monthInput.spentTotal ?? 0,
    commitments,
  })

  const deficit = computeForecastDeficit(projection.projectedFree)
  const warnings = detectForecastWarnings({
    openingBalance,
    available,
    commitmentTotal: projection.commitmentTotal,
    projectedFree: projection.projectedFree,
  })

  return {
    month: {
      month: monthInput.month,
      openingBalance,
      income,
      expectedEnvelopeAllocation,
      carryOver,
      liquidityAdjustment,
      available,
      reserved: projection.reservedTotal,
      planned: projection.plannedTotal,
      projectedFree: projection.projectedFree,
      deficit,
      warnings,
    },
    closingLiquidity: projection.projectedFree,
  }
}
