import type { PlannedExpenseCommitmentRow } from './types.js'

export function isActivePlannedExpenseCommitment(status: string): boolean {
  return status !== 'COMPLETED' && status !== 'CANCELLED'
}

/** Полная сумма активного обязательства (amount). */
export function activeCommitmentTotal(
  row: PlannedExpenseCommitmentRow,
): number {
  if (!isActivePlannedExpenseCommitment(row.status)) {
    return 0
  }

  return Math.max(0, row.amount)
}

/** Строки обязательств без категории — списание из свободного пула. */
export function filterPoolCommitmentRows(
  rows: readonly PlannedExpenseCommitmentRow[],
): PlannedExpenseCommitmentRow[] {
  return rows.filter((row) => !row.category_id)
}

/** Суммы активных планов по категориям (списание с конверта). */
export function sumPlannedCommitmentsByCategoryId(
  rows: readonly PlannedExpenseCommitmentRow[],
): Map<string, number> {
  const totals = new Map<string, number>()

  for (const row of rows) {
    const categoryId = row.category_id
    if (!categoryId) {
      continue
    }

    const total = activeCommitmentTotal(row)
    if (total <= 0) {
      continue
    }

    totals.set(categoryId, (totals.get(categoryId) ?? 0) + total)
  }

  return totals
}
