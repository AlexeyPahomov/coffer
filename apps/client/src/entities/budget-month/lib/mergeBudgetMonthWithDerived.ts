import type { Category } from '@/entities/category/model/types'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'

import type { BudgetMonthView } from '../model/types'

import { snapshotLooksStale } from './budgetMonthSnapshotTrust'
import { mapBudgetMonthToCategoryItems } from './mapBudgetMonthToItems'

/**
 * Snapshot'ы месяца (OPEN/CLOSED) накладываются на derive.
 * При неполном наборе или stale-строках остаётся derive.
 */
export function mergeBudgetMonthWithDerived(
  derived: readonly CategoryBudgetItem[],
  view: BudgetMonthView | undefined,
  categories: readonly Category[],
  periodMonth: string,
): CategoryBudgetItem[] {
  if (!view?.snapshots.length || view.periodMonth !== periodMonth) {
    return [...derived]
  }

  const fromSnapshots = mapBudgetMonthToCategoryItems(view, categories)
  if (fromSnapshots.length === 0) {
    return [...derived]
  }

  if (fromSnapshots.length < derived.length) {
    return [...derived]
  }

  const snapshotByCategoryId = new Map(
    fromSnapshots.map((item) => [item.category.id, item]),
  )

  return derived.map((item) => {
    const fromServer = snapshotByCategoryId.get(item.category.id)
    if (!fromServer || snapshotLooksStale(item, fromServer)) {
      return item
    }
    return fromServer
  })
}
