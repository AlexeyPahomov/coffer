import type { PlannedExpense } from '../model/types'

/** Отмена проведения: только завершённый план со связанным расходом. */
export function canUnfinishPlannedExpense(
  item: Pick<PlannedExpense, 'status' | 'completed_expense_id'>,
): boolean {
  return item.status === 'COMPLETED' && item.completed_expense_id != null
}
