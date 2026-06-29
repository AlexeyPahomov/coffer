import { ExpenseList } from '@/widgets/expense-list'
import type { ExpenseListViewMode } from '@/widgets/expense-list'
import type { ItemsListLayout } from '@/shared/ui/items-list/ItemsList'

import {
  getExpensePageHistoryListClassName,
  getExpensePageTabListLayout,
} from '../lib/expensePageLayout'
import { useExpensePageWorkAreaContext } from '../model/expensePageWorkAreaContext'

import { ExpensePageTabPanel } from './ExpensePageTabPanel'
import { ExpenseWorkspace } from './ExpenseWorkspace'

type CategoriesPanelProps = {
  listLayout: ItemsListLayout
  hideListTitle?: boolean
  /** Обёрнутый рабочей областью обработчик (с переключением слайда). */
  onCategorySelect: (categoryId: string) => void
}

type HistoryPanelProps = {
  listLayout: ItemsListLayout
  hideListTitle?: boolean
  hideHeaderViewSwitcher?: boolean
  historyViewMode?: ExpenseListViewMode
  onHistoryViewModeChange?: (mode: ExpenseListViewMode) => void
}

export function ExpensePageCategoriesPanel({
  listLayout,
  hideListTitle = false,
  onCategorySelect,
}: CategoriesPanelProps) {
  const {
    budgetItems,
    selectedCategoryId,
    stressCategoryId,
    isBudgetPending,
    isBudgetError,
    budgetError,
    isBudgetFetching,
  } = useExpensePageWorkAreaContext()

  return (
    <ExpensePageTabPanel slide="categories" inTab={hideListTitle}>
      <ExpenseWorkspace
        listLayout={getExpensePageTabListLayout(hideListTitle, listLayout)}
        hideListTitle={hideListTitle}
        budgetItems={budgetItems}
        selectedCategoryId={selectedCategoryId}
        stressCategoryId={stressCategoryId}
        onCategorySelect={onCategorySelect}
        isBudgetPending={isBudgetPending}
        isBudgetError={isBudgetError}
        budgetError={budgetError}
        isBudgetFetching={isBudgetFetching}
      />
    </ExpensePageTabPanel>
  )
}

export function ExpensePageHistoryPanel({
  listLayout,
  hideListTitle = false,
  hideHeaderViewSwitcher = false,
  historyViewMode,
  onHistoryViewModeChange,
}: HistoryPanelProps) {
  const {
    periodMonth,
    sortedExpenses,
    expenseCategoryFilter,
    isHistoryPending,
    isHistoryError,
    historyError,
    isHistoryFetching,
    onHistoryScroll,
    editingExpenseId,
    deletingExpenseId,
    onEditExpense,
    onDeleteExpense,
  } = useExpensePageWorkAreaContext()

  return (
    <ExpensePageTabPanel slide="history" inTab={hideListTitle}>
      <ExpenseList
        className={getExpensePageHistoryListClassName(hideListTitle)}
        layout={getExpensePageTabListLayout(hideListTitle, listLayout)}
        hideListTitle={hideListTitle}
        hideHeaderViewSwitcher={hideHeaderViewSwitcher}
        viewMode={historyViewMode}
        onViewModeChange={onHistoryViewModeChange}
        monthFilter={periodMonth}
        expenses={sortedExpenses}
        categoryFilter={expenseCategoryFilter}
        serverMonthFiltered
        isPending={isHistoryPending}
        isError={isHistoryError}
        error={historyError}
        isFetching={isHistoryFetching}
        onListScroll={onHistoryScroll}
        editingExpenseId={editingExpenseId}
        deletingExpenseId={deletingExpenseId}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
      />
    </ExpensePageTabPanel>
  )
}
