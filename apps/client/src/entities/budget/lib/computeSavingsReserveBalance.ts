import { filterReceivedAllocations } from '@/entities/allocation/lib/filterReceivedAllocations'
import { sumAllocationAmounts } from '@/entities/allocation/model/calculations'
import { isSavingsCategory } from '@/entities/category/lib/categoryKind'
import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import { sumMoneyAmounts } from '@coffer/shared'

/** Суммарный остаток по категориям накоплений: полученные распределения − все траты. */
export function computeSavingsReserveBalance(
  categories: readonly Category[],
  allocations: readonly Allocation[],
  expenses: readonly Expense[],
): number {
  const savingsCategoryIds = new Set(
    categories
      .filter((category) => isSavingsCategory(category.type))
      .map((category) => category.id),
  )
  if (savingsCategoryIds.size === 0) {
    return 0
  }

  const allocatedTotal = sumAllocationAmounts(
    filterReceivedAllocations(allocations).filter((allocation) =>
      savingsCategoryIds.has(allocation.category_id),
    ),
  )
  const spentTotal = sumMoneyAmounts(
    expenses
      .filter((expense) => savingsCategoryIds.has(expense.category_id))
      .map((expense) => expense.amount),
  )

  return Math.max(0, allocatedTotal - spentTotal)
}

export function findSavingsCategory(
  categories: readonly Category[],
): Category | undefined {
  return categories.find((category) => isSavingsCategory(category.type))
}
