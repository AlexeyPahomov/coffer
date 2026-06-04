import { isSavingsCategory } from '@/entities/category/lib/categoryKind'

import type { CategoryBudgetItem } from '../model/types'

function hasEnvelopeActivity(item: CategoryBudgetItem): boolean {
  return (
    item.carriedFromPrevious !== 0 ||
    item.allocated !== 0 ||
    item.spent !== 0
  )
}

/** Конверты расходных категорий (без накоплений — они в сводке «В резерве»). */
export function filterExpenseEnvelopeBudgetItems(
  items: readonly CategoryBudgetItem[],
): CategoryBudgetItem[] {
  return items.filter(
    (item) => !isSavingsCategory(item.category.type) && hasEnvelopeActivity(item),
  )
}
