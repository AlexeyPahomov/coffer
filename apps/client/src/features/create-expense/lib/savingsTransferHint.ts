import type { CategoryBudgetSnapshot } from '@/entities/budget'
import { isSavingsCategory } from '@/entities/category/lib/categoryKind'

import type { ExpenseBudgetPreview } from '../model/budget'

export type SavingsTransferHint = {
  savingsName: string
  available: number
  shortfall: number
}

/** Расходный конверт в минусе, а в накоплениях есть резерв — подсказка про перенос. */
export function buildSavingsTransferHint(
  budgets: readonly CategoryBudgetSnapshot[],
  preview: ExpenseBudgetPreview | null,
): SavingsTransferHint | null {
  if (!preview?.isOverBudget) {
    return null
  }

  if (isSavingsCategory(preview.categoryType)) {
    return null
  }

  const savings = budgets
    .filter(
      (row) =>
        isSavingsCategory(row.categoryType) &&
        row.categoryId !== preview.categoryId &&
        row.remaining > 0,
    )
    .sort((a, b) => b.remaining - a.remaining)[0]

  if (!savings) {
    return null
  }

  return {
    savingsName: savings.categoryName,
    available: savings.remaining,
    shortfall: preview.overAmount,
  }
}
