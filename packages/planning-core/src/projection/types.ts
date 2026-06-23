/** Planning / forecasting domain (не @coffer/shared). */

export type ActivePlannedExpenseStatus = 'PLANNED' | 'RESERVED'

export type PlannedExpenseCommitmentRow = {
  amount: number
  reserved_amount: number
  status: string
  /** Если задана — обязательство списывается с конверта, иначе со свободного пула. */
  category_id?: string | null
}

export type PlannedExpenseCommitments = {
  /** Сумма ещё не зарезервированных обязательств (amount − reserved). */
  planned: number
  /** Замороженная ликвидность. */
  reserved: number
}

export type MonthBudgetProjectionInput = {
  /** Не распределено по конвертам (факт / reporting pool). */
  available: number
  /** Уже потрачено за месяц (факт). */
  spentTotal: number
  commitments: PlannedExpenseCommitments
}

export type MonthBudgetProjection = {
  available: number
  spentTotal: number
  plannedTotal: number
  reservedTotal: number
  commitmentTotal: number
  projectedFree: number
  /** Прогноз распределения ожидаемых доходов по конвертам (только planning UI). */
  expectedEnvelopeAllocation?: number
}
