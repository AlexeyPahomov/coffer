import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import { computeCategoryBudgetsForPeriod, toBudgetRebuildCategory } from '@coffer/shared'
import { filterReceivedAllocations } from '@/entities/allocation/lib/filterReceivedAllocations'
import { toBudgetRebuildAllocation } from '@/entities/allocation/lib/toBudgetRebuildAllocation'

import type { CategoryBudgetItem } from '../model/types'
import type { BudgetTotals } from '../model/budgetTotals'

import { getEnvelopeBudgetTotal } from './envelope'
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
    filterReceivedAllocations(allocations).map(toBudgetRebuildAllocation),
    expenses.map((e) => ({
      category_id: e.category_id,
      amount: e.amount,
      date: e.date,
    })),
    periodMonth,
  )

  return mapCategoryBudgetRows(categories, rebuilt)
}

/** По убыванию суммы зачисления конверта (второй цифры после «/»), затем по остатку. */
export function sortBudgetItemsForDisplay(
  items: readonly CategoryBudgetItem[],
): CategoryBudgetItem[] {
  return [...items].sort((a, b) => {
    const byBudget = getEnvelopeBudgetTotal(b) - getEnvelopeBudgetTotal(a)
    if (byBudget !== 0) {
      return byBudget
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
