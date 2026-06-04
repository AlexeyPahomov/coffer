import { isSavingsCategory } from '@/entities/category/lib/categoryKind'

import type { CategoryBudgetItem } from '../model/types'

/** Сумма отрицательных остатков расходных конвертов (перерасход уменьшает свободные средства). */
export function sumExpenseOverspendCharge(
  budgetItems: readonly CategoryBudgetItem[],
): number {
  return budgetItems
    .filter((item) => !isSavingsCategory(item.category.type))
    .reduce((sum, item) => sum + Math.min(0, item.remaining), 0)
}
