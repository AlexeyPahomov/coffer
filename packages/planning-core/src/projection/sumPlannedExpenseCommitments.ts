import type {
  PlannedExpenseCommitmentRow,
  PlannedExpenseCommitments,
} from './types.js'
import { isActivePlannedExpenseCommitment } from './plannedExpenseCommitmentUtils.js'

/** Суммы по активным обязательствам (без COMPLETED / CANCELLED). */
export function sumPlannedExpenseCommitments(
  rows: readonly PlannedExpenseCommitmentRow[],
): PlannedExpenseCommitments {
  let planned = 0
  let reserved = 0

  for (const row of rows) {
    if (!isActivePlannedExpenseCommitment(row.status)) {
      continue
    }

    const reservedPortion = Math.min(
      Math.max(0, row.reserved_amount),
      row.amount,
    )
    reserved += reservedPortion
    planned += Math.max(0, row.amount - reservedPortion)
  }

  return { planned, reserved }
}
