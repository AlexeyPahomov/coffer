import { useMemo, useState, type UIEventHandler } from 'react';

import { ExpenseCard } from '@/entities/expense/ui/ExpenseCard';
import {
  listItemHighlightActiveClassName,
  listItemHighlightBaseClassName,
} from '@/shared/config/listHighlight';
import { cn } from '@/shared/lib/utils';
import { ItemsList } from '@/shared/ui';
import type { ItemsListLayout } from '@/shared/ui/items-list/ItemsList';
import { itemsListInTabUlClassName } from '@/shared/ui/items-list/itemsListLayout';

import { filterExpensesByCategoryAndMonth } from '../lib/filterExpenses';
import type { ExpenseListItem } from '../model/types';

import {
  ExpenseListToolbar,
  type ExpenseListViewMode,
} from './ExpenseListToolbar';

export interface ExpenseListProps {
  expenses?: ExpenseListItem[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isFetching?: boolean;
  className?: string;
  monthFilter: string;
  editingExpenseId?: string | null;
  deletingExpenseId?: string | null;
  onEdit?: (item: ExpenseListItem) => void;
  onDelete?: (id: string) => void;
  onListScroll?: UIEventHandler<HTMLUListElement>;
  onTitleClick?: () => void;
  bodyCollapsed?: boolean;
  /** `all` или id категории (задаётся снаружи, например кликом по карточке). */
  categoryFilter?: string;
  layout?: ItemsListLayout;
  /** Скрыть заголовок списка (например, заголовок вынесен в табы). */
  hideListTitle?: boolean;
  /** Скрыть переключатель вида в шапке списка (рендер снаружи, напр. у FAB). */
  hideHeaderViewSwitcher?: boolean;
  viewMode?: ExpenseListViewMode;
  onViewModeChange?: (mode: ExpenseListViewMode) => void;
}

export function ExpenseList({
  expenses,
  isPending,
  isError,
  error,
  isFetching = false,
  className,
  monthFilter,
  editingExpenseId = null,
  deletingExpenseId = null,
  onEdit,
  onDelete,
  onListScroll,
  onTitleClick,
  bodyCollapsed = false,
  categoryFilter = 'all',
  layout = 'fill',
  hideListTitle = false,
  hideHeaderViewSwitcher = false,
  viewMode: viewModeProp,
  onViewModeChange,
}: ExpenseListProps) {
  const [internalViewMode, setInternalViewMode] =
    useState<ExpenseListViewMode>('list');
  const viewMode = viewModeProp ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  const filteredExpenses = useMemo(
    () =>
      filterExpensesByCategoryAndMonth(
        expenses ?? [],
        categoryFilter,
        monthFilter,
      ),
    [expenses, categoryFilter, monthFilter],
  );

  const viewSwitcher = (
    <ExpenseListToolbar viewMode={viewMode} onViewModeChange={setViewMode} />
  );

  return (
    <ItemsList
      className={cn(
        layout === 'fill' ? 'min-h-0 overflow-hidden' : 'overflow-visible',
        className,
      )}
      layout={layout}
      bodyCollapsed={bodyCollapsed}
      onTitleClick={onTitleClick}
      onListScroll={onListScroll}
      isPending={isPending}
      isError={isError}
      error={error}
      data={viewMode === 'list' ? filteredExpenses : []}
      isFetching={isFetching}
      title={hideListTitle ? undefined : 'История расходов'}
      headerEnd={hideHeaderViewSwitcher ? undefined : viewSwitcher}
      emptyMessage={
        viewMode === 'chart'
          ? 'График расходов появится в следующих версиях.'
          : 'Пока нет расходов за выбранный период.'
      }
      errorFallback="Не удалось загрузить расходы"
      listClassName={cn(
        '!space-y-2',
        hideListTitle && itemsListInTabUlClassName,
      )}
    >
      {(items) =>
        items.map((item) => {
          const isEditing = editingExpenseId === item.id;

          return (
            <li
              key={item.id}
              className={cn(
                listItemHighlightBaseClassName,
                isEditing && listItemHighlightActiveClassName,
              )}
            >
              <ExpenseCard
                expense={item}
                categoryName={item.categoryName}
                categoryType={item.categoryType}
                categoryIcon={item.categoryIcon}
                isDeleting={deletingExpenseId === item.id}
                onEdit={onEdit ? () => onEdit(item) : undefined}
                onDelete={onDelete ? () => onDelete(item.id) : undefined}
              />
            </li>
          );
        })
      }
    </ItemsList>
  );
}
