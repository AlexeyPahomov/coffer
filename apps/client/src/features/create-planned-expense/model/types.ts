export type CreatePlannedExpenseFormValues = {
  title: string
  description: string
  icon_name: string
  icon_color: string
  amount: string
  planned_date: string
  planned_date_end: string
  category_id: string
  savings_category_id: string
  savings_amount: string
}

/** Сколько можно взять в месяце плана, не уйдя в минус дальше по прогнозу. */
export type PlannedExpenseAvailableFunds = {
  pool: number
  savings: number
}

export type ResolvePlannedExpenseAvailableFunds = (
  periodMonth: string,
  excludePlanId: string | null,
) => PlannedExpenseAvailableFunds | null
