import type { ReactNode } from 'react';

import type { CategoryBudgetItem } from '@/entities/budget/model/types';
import { cn } from '@/shared/lib/utils';
import type { ItemsListLayout } from '@/shared/ui/items-list/ItemsList';
import { CategoryBudgetList } from '@/widgets/category-budget-list';

import { expensePageListInTabClassName } from '../lib/expensePageLayout';

type ExpenseWorkspaceProps = {
  budgetItems: CategoryBudgetItem[] | undefined;
  selectedCategoryId: string | null;
  stressCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  isBudgetPending: boolean;
  isBudgetError: boolean;
  budgetError: unknown;
  budgetErrorFallback?: string;
  isBudgetFetching: boolean;
  renderItemAction?: (item: CategoryBudgetItem) => ReactNode;
  listLayout?: ItemsListLayout;
  hideListTitle?: boolean;
};

export function ExpenseWorkspace({
  budgetItems,
  selectedCategoryId,
  stressCategoryId,
  onCategorySelect,
  isBudgetPending,
  isBudgetError,
  budgetError,
  budgetErrorFallback,
  isBudgetFetching,
  renderItemAction,
  listLayout = 'fill',
  hideListTitle = false,
}: ExpenseWorkspaceProps) {
  return (
    <CategoryBudgetList
      className={cn('w-full', hideListTitle && expensePageListInTabClassName)}
      layout={listLayout}
      hideListTitle={hideListTitle}
      budgetItems={budgetItems}
      isPending={isBudgetPending}
      isError={isBudgetError}
      error={budgetError}
      errorFallback={budgetErrorFallback}
      isFetching={isBudgetFetching}
      selectedCategoryId={selectedCategoryId}
      stressCategoryId={stressCategoryId}
      onCategorySelect={onCategorySelect}
      renderItemAction={renderItemAction}
    />
  );
}
