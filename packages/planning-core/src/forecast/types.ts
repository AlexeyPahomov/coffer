import type { PlannedExpenseCommitmentRow } from '../projection/types.js'

export type ForecastWarningType =
  | 'DEFICIT'
  | 'NEGATIVE_CARRY'
  | 'OVERBOOKED'
  | 'GOAL_UNDERFUNDED'

export type ForecastWarningSeverity = 'info' | 'warning' | 'critical'

export type ForecastWarning = {
  type: ForecastWarningType
  severity: ForecastWarningSeverity
}

export type ForecastMonth = {
  month: string
  openingBalance: number
  /** Ожидаемые поступления (брутто, до распределения по конвертам). */
  income: number
  /** Прогноз распределения ожидаемых доходов по конвертам. */
  expectedEnvelopeAllocation: number
  carryOver: number
  /** Корректировки пула (например overspend charge). */
  liquidityAdjustment: number
  /** Ликвидность до обязательств: opening + income − envelopeAllocation + carryOver + adjustment. */
  available: number
  reserved: number
  planned: number
  projectedFree: number
  /** Сумма дефицита при projectedFree < 0. */
  deficit: number
  warnings: ForecastWarning[]
}

export type ForecastChainMonthInput = {
  month: string
  income: number
  /** Сумма, которая уйдёт из пула в конверты при поступлении ожидаемых доходов. */
  expectedEnvelopeAllocation?: number
  carryOver?: number
  liquidityAdjustment?: number
  spentTotal?: number
  commitmentRows: readonly PlannedExpenseCommitmentRow[]
}

export type BuildForecastChainInput = {
  months: readonly ForecastChainMonthInput[]
  /** Ликвидность до первого месяца цепочки (по умолчанию 0). */
  initialOpening?: number
}

export type ForecastChainMetadata = {
  monthCount: number
  hasDeficit: boolean
  firstDeficitMonth: string | null
  hasNegativeCarry: boolean
  /** Месяцы, где openingBalance < 0 из-за propagation. */
  propagatedDeficitMonths: string[]
  warningCount: number
  warningsByType: Partial<Record<ForecastWarningType, number>>
}

export type ForecastChainResult = {
  months: ForecastMonth[]
  metadata: ForecastChainMetadata
}
