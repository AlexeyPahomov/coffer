import { useCallback, useMemo, useState } from 'react';

import { useDeleteExpenseMutation } from '@/entities/expense/api/useDeleteExpenseMutation';
import type { Expense } from '@/entities/expense/model/types';
import type { ExpenseListItem } from '@/widgets/expense-list';
import { ExpenseFormDialog } from '@/features/create-expense/ui/ExpenseFormDialog';
import { Fab, PageSection } from '@/shared/ui';

import {
  expensePageSectionClassName,
  expensePageShellWorkScrollClassName,
  getExpensePageShellClassName,
} from '../lib/expensePageLayout';
import { toBudgetSnapshots } from '../lib/toBudgetSnapshots';
import { useExpensePageCategorySelection } from '../model/useExpensePageCategorySelection';
import { useExpensePageOutsideInteraction } from '../model/useExpensePageOutsideInteraction';
import { useExpenseFormDialog } from '../model/useExpenseFormDialog';
import { useExpensePage } from '../model/useExpensePage';

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
    cycleCaption,
    sortedExpenses,
    isBudgetPending,
    isBudgetError,
    budgetError,
    isBudgetFetching,
    expensesQuery,
  } = useExpensePage();

  const {
    expenseCategoryFilter,
    clearSelectedCategory,
    handleCategorySelect,
  } = useExpensePageCategorySelection({
    selectedCategoryId,
    setSelectedCategoryId,
  });

  useExpensePageOutsideInteraction({
    selectedCategoryId,
    onClearSelectedCategory: clearSelectedCategory,
  });

  const budgetSnapshots = useMemo(
    () => toBudgetSnapshots(allBudgetItems),
    [allBudgetItems],
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
          <ExpensePageWorkArea
            periodMonth={periodMonth}
            cycleCaption={cycleCaption}
            expenseCategories={expenseCategories}
            budgetSnapshots={budgetSnapshots}
            incomes={incomes}
            allocations={allocations}
            budgetItems={budgetItems}
            selectedCategoryId={selectedCategoryId}
            editingExpense={editingExpense}
            onCancelEdit={() => setEditingExpense(null)}
            stressCategoryId={stressCategoryId}
            onStressCategoryChange={handleStressCategoryChange}
            onCategorySelect={handleCategorySelect}
            isBudgetPending={isBudgetPending}
            isBudgetError={isBudgetError}
            budgetError={budgetError}
            isBudgetFetching={isBudgetFetching}
            sortedExpenses={sortedExpenses}
            expenseCategoryFilter={expenseCategoryFilter}
            expensesQuery={expensesQuery}
            editingExpenseId={editingExpense?.id ?? null}
            deletingExpenseId={
              deleteExpenseMutation.isPending
                ? (deleteExpenseMutation.variables ?? null)
                : null
            }
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onAddExpense={expenseFormDialog.openForAdd}
          />
        </div>
      </div>

      <Fab label="Добавить расход" onClick={expenseFormDialog.openForAdd} />

      <ExpenseFormDialog
        open={expenseFormDialog.isOpen}
        onOpenChange={expenseFormDialog.onOpenChange}
        isEditing={expenseFormDialog.isEditing}
        onClose={expenseFormDialog.close}
        categories={expenseCategories}
        budgets={budgetSnapshots}
        incomes={incomes}
        allocations={allocations}
        selectedCategoryId={selectedCategoryId ?? undefined}
        editingExpense={editingExpense}
        onStressCategoryChange={handleStressCategoryChange}
      />
    </PageSection>
  );
}
