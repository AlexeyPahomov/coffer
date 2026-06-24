import type { Category } from '@/entities/category/model/types'
import { isBudgetEnvelopeCategory } from '@/entities/category/lib/categoryKind'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'

import type { BudgetMonthView } from '../model/types'

import { mapBudgetMonthToCategoryItems } from './mapBudgetMonthToItems'

export function budgetEnvelopeCategories(
  categories: readonly Category[],
): Category[] {
  return categories.filter((category) =>
    isBudgetEnvelopeCategory(category.type),
  )
}

export function snapshotLooksStale(
  derived: CategoryBudgetItem,
  fromServer: CategoryBudgetItem,
): boolean {
  const serverEmpty =
    fromServer.allocated === 0 &&
    fromServer.spent === 0 &&
    fromServer.carriedFromPrevious === 0
  const derivedHasActivity =
    derived.allocated !== 0 ||
    derived.spent !== 0 ||
    derived.carriedFromPrevious !== 0

  return serverEmpty && derivedHasActivity
}

/** Полный набор snapshot'ов для конвертных категорий — можно не гонять derive. */
export function canTrustBudgetMonthSnapshots(
  view: BudgetMonthView | undefined,
  categories: readonly Category[],
  periodMonth: string,
): boolean {
  const envelopeCategories = budgetEnvelopeCategories(categories)
  if (
    !view ||
    view.periodMonth !== periodMonth ||
    view.snapshots.length === 0 ||
    envelopeCategories.length === 0
  ) {
    return false
  }

  if (view.status !== 'OPEN' && view.status !== 'CLOSED') {
    return false
  }

  const snapshotCategoryIds = new Set(
    view.snapshots.map((snapshot) => snapshot.categoryId),
  )

  return envelopeCategories.every((category) =>
    snapshotCategoryIds.has(category.id),
  )
}

export function resolveBudgetItemsFromMonthSnapshots(
  view: BudgetMonthView,
  categories: readonly Category[],
  periodMonth: string,
): CategoryBudgetItem[] | null {
  if (!canTrustBudgetMonthSnapshots(view, categories, periodMonth)) {
    return null
  }

  return mapBudgetMonthToCategoryItems(view, categories)
}
