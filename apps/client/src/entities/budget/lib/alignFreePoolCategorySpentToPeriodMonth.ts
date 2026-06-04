import type { Expense } from '@/entities/expense/model/types'
import { sumMoneyAmounts } from '@coffer/shared'

import type { CategoryBudgetItem } from '../model/types'

import { hasEnvelopeLimit } from './envelope'
import { filterExpensesByPeriod } from './periodFilters'

/**
 * В режиме цикла snapshot.travel включает все траты цикла.
 * На карточках категорий без лимита показываем только траты выбранного учётного месяца
 * (как история расходов), без «переноса» майских сумм в июнь.
 */
export function alignFreePoolCategorySpentToPeriodMonth(
  items: readonly CategoryBudgetItem[],
  expenses: readonly Expense[],
  periodMonth: string,
): CategoryBudgetItem[] {
  const periodExpenses = filterExpensesByPeriod(expenses, periodMonth)

  return items.map((item) => {
    if (hasEnvelopeLimit(item)) {
      return item
    }

    const spent = sumMoneyAmounts(
      periodExpenses
        .filter((expense) => expense.category_id === item.category.id)
        .map((expense) => expense.amount),
    )

    return { ...item, spent }
  })
}
