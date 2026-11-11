import {
  filterPoolCommitmentRows,
  sumPlannedExpenseCommitments,
  type PlannedExpenseCommitmentRow,
  type PlannedExpenseCommitments,
} from '@coffer/planning-core'

import type { PlannedExpense } from '../model/types'

/**
 * План с долей из накоплений даёт две строки: основную (category_id или пул) и
 * строку конверта накоплений. Резерв сначала покрывает основную часть.
 */
export function toPlannedExpenseCommitmentRows(
  items: readonly PlannedExpense[],
): PlannedExpenseCommitmentRow[] {
  return items.flatMap((item) => {
    const savingsAmount = item.savings_category_id
      ? Math.min(Math.max(0, item.savings_amount), item.amount)
      : 0
    const mainAmount = item.amount - savingsAmount
    const mainReserved = Math.min(item.reserved_amount, mainAmount)
    const mainRow: PlannedExpenseCommitmentRow = {
      amount: mainAmount,
      reserved_amount: mainReserved,
      status: item.status,
      category_id: item.category_id,
    }

    if (savingsAmount <= 0) {
      return [mainRow]
    }

    return [
      mainRow,
      {
        amount: savingsAmount,
        reserved_amount: Math.max(0, item.reserved_amount - mainReserved),
        status: item.status,
        category_id: item.savings_category_id,
      },
    ]
  })
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
