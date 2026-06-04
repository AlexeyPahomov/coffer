import type { IncomeStatus, IncomeType } from '@coffer/shared'

export type IncomeFormValues = {
  amount: string
  source: string
  income_type: IncomeType
  status: IncomeStatus
  /** Дата получения дохода (`YYYY-MM-DD`). */
  period_month: string
}

export type IncomeFormPayload = {
  amount: number
  source: string | undefined
  income_type: IncomeType
  status: IncomeStatus
  period_month: string
}
