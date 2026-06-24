import type { ExpenseListItem } from '../model/types'

type FilterExpensesOptions = {
  skipMonthFilter?: boolean
}

export function filterExpensesByCategoryAndMonth(
  expenses: readonly ExpenseListItem[],
  categoryFilter: string,
  monthFilter: string,
  options?: FilterExpensesOptions,
): ExpenseListItem[] {
  const monthPrefix = monthFilter.trim().slice(0, 7)

  return expenses.filter((expense) => {
    if (categoryFilter !== 'all' && expense.category_id !== categoryFilter) {
      return false
    }

    if (options?.skipMonthFilter || !monthPrefix) {
      return true
    }

    return expense.date.slice(0, 7) === monthPrefix
  })
}
