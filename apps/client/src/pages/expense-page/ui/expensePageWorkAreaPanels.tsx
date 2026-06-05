import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import type { CategoryBudgetSnapshot } from '@/features/create-expense/model/budget'
import type { ItemsListLayout } from '@/shared/ui/items-list/ItemsList'
import type { ExpenseListItem, ExpenseListViewMode } from '@/widgets/expense-list'
import { ExpenseList } from '@/widgets/expense-list'

import { getExpensePageHistoryListClassName } from '../lib/expensePageLayout'

import { ExpensePageTabPanel } from './ExpensePageTabPanel'
import { ExpenseWorkspace } from './ExpenseWorkspace'

export type ExpensePageWorkAreaPanelsProps = {
  periodMonth: string
  expenseCategories: Category[]
  budgetSnapshots: CategoryBudgetSnapshot[]
  incomes: Income[]
  allocations: Allocation[]
  budgetItems: CategoryBudgetItem[]
  selectedCategoryId: string | null
  editingExpense: Expense | null
  onCancelEdit: () => void
  stressCategoryId: string | null
  onStressCategoryChange: (categoryId: string | null) => void
  onCategorySelect: (categoryId: string) => void
  isBudgetPending: boolean
  isBudgetError: boolean
  budgetError: unknown
  isBudgetFetching: boolean
  sortedExpenses: ExpenseListItem[]
  expenseCategoryFilter: string
  expensesQuery: {
    isPending: boolean
    isError: boolean
    error: unknown
    isFetching: boolean
  }
  editingExpenseId: string | null
  deletingExpenseId: string | null
  onEditExpense: (item: ExpenseListItem) => void
  onDeleteExpense: (id: string) => void
  onAddExpense: () => void
}

type ExpensePagePanelProps = ExpensePageWorkAreaPanelsProps & {
  listLayout: ItemsListLayout
  hideListTitle?: boolean
  hideHeaderViewSwitcher?: boolean
  historyViewMode?: ExpenseListViewMode
  onHistoryViewModeChange?: (mode: ExpenseListViewMode) => void
}

export function ExpensePageCategoriesPanel({
  listLayout,
  hideListTitle = false,
  budgetItems,
  selectedCategoryId,
  onAddExpense,
  stressCategoryId,
  onCategorySelect,
  isBudgetPending,
  isBudgetError,
  budgetError,
  isBudgetFetching,
}: ExpensePagePanelProps) {
  return (
    <ExpensePageTabPanel slide="categories" inTab={hideListTitle}>
      <ExpenseWorkspace
        listLayout={listLayout}
        hideListTitle={hideListTitle}
        budgetItems={budgetItems}
        selectedCategoryId={selectedCategoryId}
        onAddExpense={onAddExpense}
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
  periodMonth,
  sortedExpenses,
  expenseCategoryFilter,
  expensesQuery,
  isBudgetPending,
  editingExpenseId,
  deletingExpenseId,
  onEditExpense,
  onDeleteExpense,
}: ExpensePagePanelProps) {
  return (
    <ExpensePageTabPanel slide="history" inTab={hideListTitle} topInset={hideListTitle}>
      <ExpenseList
        className={getExpensePageHistoryListClassName(hideListTitle)}
        layout={listLayout}
        hideListTitle={hideListTitle}
        hideHeaderViewSwitcher={hideHeaderViewSwitcher}
        viewMode={historyViewMode}
        onViewModeChange={onHistoryViewModeChange}
        monthFilter={periodMonth}
        expenses={sortedExpenses}
        categoryFilter={expenseCategoryFilter}
        isPending={isBudgetPending}
        isError={expensesQuery.isError}
        error={expensesQuery.error}
        isFetching={expensesQuery.isFetching}
        editingExpenseId={editingExpenseId}
        deletingExpenseId={deletingExpenseId}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
      />
    </ExpensePageTabPanel>
  )
}
