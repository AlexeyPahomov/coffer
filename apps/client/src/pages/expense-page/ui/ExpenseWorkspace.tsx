import type { CategoryBudgetItem } from '@/entities/budget/model/types';
import { cn } from '@/shared/lib/utils';
import { AddButton, fabDesktopAddButtonClassName } from '@/shared/ui';
import type { ItemsListLayout } from '@/shared/ui/items-list/ItemsList';
import { expensePageListInTabClassName } from '../lib/expensePageLayout';
import { categoryBudgetListCompactShellClassName } from '@/widgets/category-budget-list/lib/categoryBudgetListLayout';
import { CategoryBudgetList } from '@/widgets/category-budget-list';

type ExpenseWorkspaceProps = {
  budgetItems: CategoryBudgetItem[];
  selectedCategoryId: string | null;
  onAddExpense: () => void;
  stressCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  isBudgetPending: boolean;
  isBudgetError: boolean;
  budgetError: unknown;
  isBudgetFetching: boolean;
  listLayout?: ItemsListLayout;
  hideListTitle?: boolean;
};

export function ExpenseWorkspace({
  budgetItems,
  selectedCategoryId,
  onAddExpense,
  stressCategoryId,
  onCategorySelect,
  isBudgetPending,
  isBudgetError,
  budgetError,
  isBudgetFetching,
  listLayout = 'fill',
  hideListTitle = false,
}: ExpenseWorkspaceProps) {
  const categoriesCompact = listLayout === 'fill';

  return (
    <div
      className={cn(
        listLayout === 'fill' &&
          cn(
            'flex w-full min-h-0 flex-1 flex-col overflow-hidden',
            categoryBudgetListCompactShellClassName,
          ),
      )}
    >
      <CategoryBudgetList
        className={cn(
          'w-full',
          listLayout === 'fill' && 'min-h-0 flex-1 overflow-hidden',
          hideListTitle && expensePageListInTabClassName,
        )}
        layout={listLayout}
        hideListTitle={hideListTitle}
        limitToTwoRows={categoriesCompact}
        budgetItems={budgetItems}
        isPending={isBudgetPending}
        isError={isBudgetError}
        error={budgetError}
        isFetching={isBudgetFetching}
        selectedCategoryId={selectedCategoryId}
        stressCategoryId={stressCategoryId}
        onCategorySelect={onCategorySelect}
        headerEnd={
          <AddButton
            className={fabDesktopAddButtonClassName}
            onClick={onAddExpense}
          >
            Добавить расход
          </AddButton>
        }
      />
    </div>
  );
}
