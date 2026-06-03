import type { PlannedExpense } from '../model/types'

/** План с резервом можно провести в расход. */
export function canFinishPlannedExpense(
  item: Pick<PlannedExpense, 'status' | 'reserved_amount'>,
): boolean {
  return item.status === 'RESERVED' || item.reserved_amount > 0
}
