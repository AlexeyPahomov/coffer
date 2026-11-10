import {
  filterPoolCommitmentRows,
  sumPlannedExpenseCommitments,
  type PlannedExpenseCommitmentRow,
  type PlannedExpenseCommitments,
} from '@coffer/planning-core'

import type { PlannedExpense } from '../model/types'

export function toPlannedExpenseCommitmentRows(
  items: readonly PlannedExpense[],
): PlannedExpenseCommitmentRow[] {
  return items.map((item) => ({
    amount: item.amount,
    reserved_amount: item.reserved_amount,
    status: item.status,
    category_id: item.category_id,
  }))
}

/** Обязательства планов, списываемые из свободного пула. */
export function toPoolCommitmentRows(
  items: readonly PlannedExpense[],
): PlannedExpenseCommitmentRow[] {
  return filterPoolCommitmentRows(toPlannedExpenseCommitmentRows(items))
}

/** Обязательства планов конвертов: их покрывает аллокация конверта, не свободный пул. */
export function sumEnvelopeCommitments(
  items: readonly PlannedExpense[],
): PlannedExpenseCommitments {
  const envelopeRows = toPlannedExpenseCommitmentRows(items).filter(
    (row) => row.category_id,
  )
  return sumPlannedExpenseCommitments(envelopeRows)
}
