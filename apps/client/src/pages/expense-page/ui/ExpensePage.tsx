import { useCallback, useMemo, useState, type UIEventHandler } from 'react';

import type { CategoryBudgetItem } from '@/entities/budget';
import { useDeleteExpenseMutation } from '@/entities/expense/api/useDeleteExpenseMutation';
import {
  flattenExpenseHistoryPages,
  useExpenseHistoryQuery,
} from '@/entities/expense/api/useExpenseHistoryQuery';
import type { Expense } from '@/entities/expense/model/types';
import type { ExpenseListItem } from '@/widgets/expense-list';
import { ExpenseFormDialog } from '@/features/create-expense/ui/ExpenseFormDialog';
import {
  buildReturnToSavingsHint,
  ReturnToSavingsButton,
} from '@/features/return-to-savings';
import { Fab, PageSection } from '@/shared/ui';

import {
  expensePageSectionClassName,
  expensePageShellWorkScrollClassName,
  getExpensePageShellClassName,
} from '../lib/expensePageLayout';
import { EXPENSE_ADD_LABEL } from '../lib/expensePageCopy';
import { enrichExpensesWithCategory } from '../lib/enrichExpenses';
import { toBudgetSnapshots } from '../lib/toBudgetSnapshots';
import { useExpensePageCategorySelection } from '../model/useExpensePageCategorySelection';
import { useExpensePageOutsideInteraction } from '../model/useExpensePageOutsideInteraction';
import { useExpenseFormDialog } from '../model/useExpenseFormDialog';
import { useExpensePage } from '../model/useExpensePage';
import { ExpensePageWorkAreaContext } from '../model/expensePageWorkAreaContext';

import { ExpensePageBudgetSection } from './ExpensePageBudgetSection';
import { ExpensePageToolbar } from './ExpensePageToolbar';
import { ExpensePageWorkArea } from './ExpensePageWorkArea';

export function ExpensePage() {
  const [stressCategoryId, setStressCategoryId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const deleteExpenseMutation = useDeleteExpenseMutation();

  const {
    selectedCategoryId,
    setSelectedCategoryId,
    expenseCategories,
    incomes,
    allocations,
    allBudgetItems,
    budgetItems,
    periodMonth,
    setPeriodMonth,
    currentBudgetView,
    categories,
    isBudgetPending,
    isBudgetError,
    budgetError,
    isBudgetFetching,
  } = useExpensePage();

  const {
    expenseCategoryFilter,
    clearSelectedCategory,
    handleCategorySelect,
  } = useExpensePageCategorySelection({
    selectedCategoryId,
    setSelectedCategoryId,
  });

  const historyQuery = useExpenseHistoryQuery(periodMonth, expenseCategoryFilter)

  const sortedExpenses = useMemo((): ExpenseListItem[] => {
    const flat = flattenExpenseHistoryPages(historyQuery.data?.pages)
    return enrichExpensesWithCategory(flat, categories)
  }, [categories, historyQuery.data?.pages])

  const handleHistoryScroll = useCallback<UIEventHandler<HTMLUListElement>>(
    (event) => {
      if (!historyQuery.hasNextPage || historyQuery.isFetchingNextPage) {
        return
      }

      const target = event.currentTarget
      const remaining =
        target.scrollHeight - target.scrollTop - target.clientHeight
      if (remaining < 120) {
        void historyQuery.fetchNextPage()
      }
    },
    [historyQuery],
  )

  useExpensePageOutsideInteraction({
    selectedCategoryId,
    onClearSelectedCategory: clearSelectedCategory,
  });

  const budgetSnapshots = useMemo(
    () => toBudgetSnapshots(allBudgetItems),
    [allBudgetItems],
  );

  const renderBudgetItemAction = useCallback(
    (item: CategoryBudgetItem) => {
      const hint = buildReturnToSavingsHint(item, budgetSnapshots);
      if (!hint) {
        return null;
      }
      return (
        <ReturnToSavingsButton
          fromCategoryId={item.category.id}
          hint={hint}
          periodMonth={periodMonth}
        />
      );
    },
    [budgetSnapshots, periodMonth],
  );

  const expenseFormDialog = useExpenseFormDialog(editingExpense, () => {
    setEditingExpense(null);
  });

  const handleStressCategoryChange = useCallback(
    (categoryId: string | null) => {
      setStressCategoryId((prev) => (prev === categoryId ? prev : categoryId));
    },
    [],
  );

  const handleEditExpense = useCallback(
    (item: ExpenseListItem) => {
      setEditingExpense(item);
      setSelectedCategoryId(item.category_id);
    },
    [setSelectedCategoryId],
  );

  const handleDeleteExpense = useCallback(
    (id: string) => {
      if (editingExpense?.id === id) {
        setEditingExpense(null);
      }
      deleteExpenseMutation.mutate(id);
    },
    [deleteExpenseMutation, editingExpense?.id],
  );

  return (
    <PageSection
      className={expensePageSectionClassName}
      header={
        <ExpensePageToolbar
          periodMonth={periodMonth}
          onPeriodMonthChange={setPeriodMonth}
        />
      }
      mobileSidebarOnHeader={false}
    >
      <div className={getExpensePageShellClassName()}>
        <ExpensePageBudgetSection
          summary={
            currentBudgetView ?? {
              available: 0,
              inReserve: 0,
              spentThisMonth: 0,
              carryForwardTotal: 0,
            }
          }
        />

        <div className={expensePageShellWorkScrollClassName}>
          <ExpensePageWorkAreaContext.Provider
            value={{
              periodMonth,
              budgetItems,
              selectedCategoryId,
              stressCategoryId,
              onCategorySelect: handleCategorySelect,
              renderItemAction: renderBudgetItemAction,
              onAddExpense: expenseFormDialog.openForAdd,
              isBudgetPending,
              isBudgetError,
              budgetError,
              isBudgetFetching,
              sortedExpenses,
              expenseCategoryFilter,
              isHistoryPending:
                historyQuery.isPending && historyQuery.data === undefined,
              isHistoryError: historyQuery.isError,
              historyError: historyQuery.error,
              isHistoryFetching: historyQuery.isFetchingNextPage,
              onHistoryScroll: handleHistoryScroll,
              editingExpenseId: editingExpense?.id ?? null,
              deletingExpenseId: deleteExpenseMutation.isPending
                ? (deleteExpenseMutation.variables ?? null)
                : null,
              onEditExpense: handleEditExpense,
              onDeleteExpense: handleDeleteExpense,
            }}
          >
            <ExpensePageWorkArea />
          </ExpensePageWorkAreaContext.Provider>
        </div>
      </div>

      <Fab label={EXPENSE_ADD_LABEL} onClick={expenseFormDialog.openForAdd} />

      <ExpenseFormDialog
        open={expenseFormDialog.isOpen}
        onOpenChange={expenseFormDialog.onOpenChange}
        isEditing={expenseFormDialog.isEditing}
        onClose={expenseFormDialog.close}
        categories={expenseCategories}
        budgets={budgetSnapshots}
        incomes={incomes}
        allocations={allocations}
        freePoolAvailable={currentBudgetView?.available ?? 0}
        savingsReserveAvailable={currentBudgetView?.inReserve ?? 0}
        selectedCategoryId={selectedCategoryId ?? undefined}
        editingExpense={editingExpense}
        onStressCategoryChange={handleStressCategoryChange}
      />
    </PageSection>
  );
}
