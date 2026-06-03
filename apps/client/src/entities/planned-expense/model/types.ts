export type PlannedExpenseStatus =
  | 'PLANNED'
  | 'RESERVED'
  | 'COMPLETED'
  | 'CANCELLED'

export type PlannedExpense = {
  id: string
  user_id: string
  title: string
  description: string | null
  icon_name: string
  icon_color: string
  amount: number
  reserved_amount: number
  planned_date: string
  planned_date_end: string | null
  status: PlannedExpenseStatus
  category_id: string | null
  budget_month_id: string
  /** Якорь планирования — `BudgetMonth` (YYYY-MM). */
  period_month: string
  completed_expense_id?: string | null
  created_at: string
  updated_at: string
}

export type CreatePlannedExpensePayload = {
  title: string
  description?: string
  icon_name?: string
  icon_color?: string
  amount: number
  planned_date: string
  planned_date_end?: string
  category_id?: string
}

export type UpdatePlannedExpensePayload = {
  title?: string
  description?: string
  icon_name?: string
  icon_color?: string
  amount?: number
  planned_date?: string
  planned_date_end?: string | null
  status?: PlannedExpenseStatus
  reserved_amount?: number
  category_id?: string | null
}

export type FinishPlannedExpensePayload = {
  category_id?: string
  amount: number
  description?: string
  date: string
}
