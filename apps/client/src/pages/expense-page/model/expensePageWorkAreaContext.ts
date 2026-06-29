import { createContext, useContext, type UIEventHandler } from 'react'

import type { CategoryBudgetItem } from '@/entities/budget'
import type { ExpenseListItem } from '@/widgets/expense-list'

/**
 * Данные рабочей области расходов, общие для панелей «Категории» и «История».
 * Заводятся на странице ({@link ExpensePage}) и потребляются панелями напрямую,
 * чтобы `ExpensePageWorkArea` не прокидывал их сквозным prop-мешком. Чисто
 * презентационные параметры (layout, режим списка, обёрнутый `onCategorySelect`)
 * остаются явными пропсами — это локальные решения самой рабочей области.
 */
export type ExpensePageWorkAreaContextValue = {
  periodMonth: string
  budgetItems: CategoryBudgetItem[]
  selectedCategoryId: string | null
  stressCategoryId: string | null
  /** Базовый обработчик; рабочая область оборачивает его переключением слайда. */
  onCategorySelect: (categoryId: string) => void
  onAddExpense: () => void
  isBudgetPending: boolean
  isBudgetError: boolean
  budgetError: unknown
  isBudgetFetching: boolean
  sortedExpenses: ExpenseListItem[]
  expenseCategoryFilter: string
  isHistoryPending: boolean
  isHistoryError: boolean
  historyError: unknown
  isHistoryFetching: boolean
  onHistoryScroll?: UIEventHandler<HTMLUListElement>
  editingExpenseId: string | null
  deletingExpenseId: string | null
  onEditExpense: (item: ExpenseListItem) => void
  onDeleteExpense: (id: string) => void
}

export const ExpensePageWorkAreaContext =
  createContext<ExpensePageWorkAreaContextValue | null>(null)

export function useExpensePageWorkAreaContext(): ExpensePageWorkAreaContextValue {
  const value = useContext(ExpensePageWorkAreaContext)
  if (!value) {
    throw new Error(
      'useExpensePageWorkAreaContext must be used within ExpensePageWorkAreaContext.Provider',
    )
  }
  return value
}
