import type { Category } from '@/entities/category/model/types'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import { mapCategoryBudgetRows } from '@/entities/budget/lib/mapCategoryBudgetItems'

import type { BudgetCycleView } from '../model/types'

export function mapBudgetCycleToCategoryItems(
  view: BudgetCycleView,
  categories: readonly Category[],
): CategoryBudgetItem[] {
  return mapCategoryBudgetRows(
    categories,
    view.snapshots.map((snap) => ({
      categoryId: snap.categoryId,
      openingBalance: snap.openingBalance,
      allocated: snap.allocated,
      spent: snap.spent,
      closingBalance: snap.closingBalance,
    })),
  )
}
