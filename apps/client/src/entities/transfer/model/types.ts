export type Transfer = {
  id: string
  user_id: string
  from_category_id: string
  /** null = списание из накоплений в свободный пул (без конверта-получателя). */
  to_category_id: string | null
  amount: number
  period_month: string
  created_at: string
}

export type CreateTransferPayload = {
  from_category_id: string
  /** Отсутствует → списание из накоплений в свободный пул (без конверта-получателя). */
  to_category_id?: string
  amount: number
  /** Дата внутри учётного месяца перевода, напр. "2026-06-01". */
  period_month: string
}
