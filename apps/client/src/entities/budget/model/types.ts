import type { CategoryType } from '@coffer/shared'

import type { Category } from '@/entities/category/model/types'

/** Категория накоплений для сводки «В резерве». */
export type ReserveCategorySummary = {
  name: string
  icon: string | null
  type: CategoryType
}

/** Конверт категории за месяц (с opening balance). */
export type CategoryBudgetItem = {
  category: Category
  /** Остаток на начало месяца (closing предыдущего периода). */
  carriedFromPrevious: number
  /** Распределено в этом месяце. */
  allocated: number
  /** Потрачено за период/цикл (все траты по категории, для отображения). */
  spent: number
  /** Остаток конверта; при тратах без лимита остаётся 0 (деньги из свободного пула). */
  remaining: number
}
