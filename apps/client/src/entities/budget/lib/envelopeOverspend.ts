import { isSavingsCategory } from '@/entities/category/lib/categoryKind'

import type { CategoryBudgetItem } from '../model/types'

/**
 * Заряд свободного пула за перерасход конвертов — ТОЛЬКО новый перерасход
 * периода. Уже перенесённый отрицательный остаток (`carriedFromPrevious` < 0)
 * списан из пула в месяце, где возник, и учтён в переносе; повторно вычитать его
 * нельзя, иначе долг конверта уменьшает свободные средства каждый месяц.
 */
export function sumExpenseOverspendCharge(
  budgetItems: readonly CategoryBudgetItem[],
): number {
  return budgetItems
    .filter((item) => !isSavingsCategory(item.category.type))
    .reduce(
      (sum, item) =>
        sum +
        Math.min(0, item.remaining) -
        Math.min(0, item.carriedFromPrevious),
      0,
    )
}
