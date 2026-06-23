import type { Category } from '@/entities/category/model/types'

import type { PlannedExpense } from '../model/types'

/** Подпись источника плана без категории (иконка + подсказки). */
export const FREE_POOL_SOURCE_LABEL = 'Свободный пул'

export function resolvePlannedExpenseCategory(
  item: Pick<PlannedExpense, 'category_id'>,
  categories: readonly Category[],
): Category | null {
  if (!item.category_id) {
    return null
  }

  return categories.find((category) => category.id === item.category_id) ?? null
}
