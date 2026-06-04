import type { Expense } from '@/entities/expense/model/types'
import { sumMoneyAmounts } from '@coffer/shared'

import type { CategoryBudgetItem } from '../model/types'

import { hasEnvelopeLimit } from './envelope'
import { filterExpensesByPeriod } from './periodFilters'

export function buildEnvelopeLimitByCategoryId(
  items: readonly CategoryBudgetItem[],
): Map<string, boolean> {
  return new Map(
    items.map((item) => [item.category.id, hasEnvelopeLimit(item)]),
  )
}

/**
 * Траты календарного месяца, списанные со свободного пула
 * (категория без лимита конверта в переданном срезе бюджета).
 */
export function computeFreePoolExpensesInPeriodMonth(
  expenses: readonly Expense[],
  periodMonth: string,
  envelopeLimitByCategoryId: ReadonlyMap<string, boolean>,
): number {
  return sumMoneyAmounts(
    filterExpensesByPeriod(expenses, periodMonth)
      .filter(
        (expense) => !envelopeLimitByCategoryId.get(expense.category_id),
      )
      .map((expense) => expense.amount),
  )
}
