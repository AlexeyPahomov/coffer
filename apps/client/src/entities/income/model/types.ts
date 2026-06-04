import type { IncomeStatus, IncomeType } from '@coffer/shared'

/** Ответ API (Prisma Decimal в JSON приходит строкой). */
export type Income = {
  id: string
  user_id: string
  amount: string
  source: string | null
  income_type: IncomeType
  status: IncomeStatus
  period_month: string
  received_at: string | null
  created_at: string
}

/** Тело POST /income (CreateIncomeDto). */
export type CreateIncomePayload = {
  user_id: string
  amount: number
  source?: string
  income_type?: IncomeType
  status?: IncomeStatus
  period_month: string
}

/** Тело PATCH /income/:id (UpdateIncomeDto). */
export type UpdateIncomePayload = CreateIncomePayload
