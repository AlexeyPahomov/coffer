import type { Category } from '@/entities/category/model/types'

import type { ReserveCategorySummary } from '../model/types'

export function toReserveCategorySummary(
  category: Category | undefined,
): ReserveCategorySummary | undefined {
  if (!category) {
    return undefined
  }

  return {
    name: category.name,
    icon: category.icon,
    type: category.type,
  }
}
