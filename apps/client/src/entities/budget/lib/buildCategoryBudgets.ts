import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import { computeCategoryBudgetsForPeriod, toBudgetRebuildCategory } from '@coffer/shared'
import { filterReceivedAllocations } from '@/entities/allocation/lib/filterReceivedAllocations'

import type { CategoryBudgetItem } from '../model/types'
import type { BudgetTotals } from '../model/budgetTotals'

import { getEnvelopeDisplayToneSortIndex } from './envelopeBalanceTone'
import { mapCategoryBudgetRows } from './mapCategoryBudgetItems'

export function buildCategoryBudgets(
  categories: readonly Category[],
  allocations: readonly Allocation[],
  expenses: readonly Expense[],
  _incomes: readonly Income[],
  periodMonth: string,
): CategoryBudgetItem[] {
  const rebuilt = computeCategoryBudgetsForPeriod(
    categories.map(toBudgetRebuildCategory),
    filterReceivedAllocations(allocations)
      .map((a) => ({
        category_id: a.category_id,
        amount: a.amount,
        period_month: a.period_month,
      })),
    expenses.map((e) => ({
      category_id: e.category_id,
      amount: e.amount,
      date: e.date,
    })),
    periodMonth,
  )

  return mapCategoryBudgetRows(categories, rebuilt)
}

/** Красные → жёлтые → синие, внутри группы — по убыванию остатка. */
export function sortBudgetItemsForDisplay(
  items: readonly CategoryBudgetItem[],
): CategoryBudgetItem[] {
  return [...items].sort((a, b) => {
    const byTone =
      getEnvelopeDisplayToneSortIndex(a) - getEnvelopeDisplayToneSortIndex(b)
    if (byTone !== 0) {
      return byTone
    }
    return b.remaining - a.remaining
  })
}

export function sumBudgetTotals(
  items: readonly CategoryBudgetItem[],
): BudgetTotals {
  return items.reduce(
    (acc, item) => ({
      allocated: acc.allocated + item.allocated,
      spent: acc.spent + item.spent,
      remaining: acc.remaining + item.remaining,
    }),
    { allocated: 0, spent: 0, remaining: 0 },
  )
}
