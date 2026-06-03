import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { moneyAmountToFormValue } from '@/shared/lib/moneyInput'
import { todayDateInputValue } from '@/shared/lib/date'

export type FinishPlannedExpenseFormValues = {
  category_id: string
  amount: string
  description: string
  date: string
}

export const emptyFinishPlannedExpenseFormValues =
  (): FinishPlannedExpenseFormValues => ({
    category_id: '',
    amount: '',
    description: '',
    date: todayDateInputValue(),
  })

export function resolveFinishPlannedExpenseFormValues(
  item: PlannedExpense,
): FinishPlannedExpenseFormValues {
  const defaultAmount =
    item.reserved_amount > 0 ? item.reserved_amount : item.amount

  return {
    category_id: item.category_id ?? '',
    amount: moneyAmountToFormValue(defaultAmount),
    description: item.description ?? '',
    date: todayDateInputValue(),
  }
}
