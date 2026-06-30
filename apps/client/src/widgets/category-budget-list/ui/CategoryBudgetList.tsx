import type { ReactNode, UIEventHandler } from 'react';

import {
  listItemHighlightActiveClassName,
  listItemHighlightBaseClassName,
} from '@/shared/config/listHighlight';
import { cn } from '@/shared/lib/utils';
import { ItemsList } from '@/shared/ui';
import type { ItemsListLayout } from '@/shared/ui/items-list/ItemsList';
import { itemsListInTabUlClassName } from '@/shared/ui/items-list/itemsListLayout';

import { categoryBudgetListGridClassName } from '../lib/categoryBudgetListLayout';

import type { CategoryBudgetListItem } from '../model/types';

import { CategoryBudgetCard } from './CategoryBudgetCard';

export type CategoryBudgetListProps = {
  budgetItems?: CategoryBudgetListItem[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isFetching?: boolean;
  selectedCategoryId?: string | null;
  stressCategoryId?: string | null;
  onCategorySelect?: (categoryId: string) => void;
  headerEnd?: ReactNode;
  className?: string;
  onListScroll?: UIEventHandler<HTMLUListElement>;
  onTitleClick?: () => void;
  layout?: ItemsListLayout;
  /** Скрыть заголовок списка (например, заголовок вынесен в табы). */
  hideListTitle?: boolean;
  /** Доп. действие в карточке конверта (компонуется страницей; по умолчанию нет). */
  renderItemAction?: (item: CategoryBudgetListItem) => ReactNode;
};

export function CategoryBudgetList({
  budgetItems,
  isPending,
  isError,
  error,
  isFetching = false,
  selectedCategoryId,
  stressCategoryId,
  onCategorySelect,
  headerEnd,
  className,
  onListScroll,
  onTitleClick,
  layout = 'fill',
  hideListTitle = false,
  renderItemAction,
}: CategoryBudgetListProps) {
  const listClassName = cn(
    categoryBudgetListGridClassName,
    hideListTitle && itemsListInTabUlClassName,
  );

  return (
    <ItemsList
      className={className}
      layout={layout}
      listAnimateEnter={false}
      onTitleClick={onTitleClick}
      onListScroll={onListScroll}
      listClassName={listClassName}
      isPending={isPending}
      isError={isError}
      error={error}
      data={budgetItems}
      isFetching={isFetching}
      title={hideListTitle ? undefined : 'Конверты'}
      headerEnd={headerEnd}
      emptyMessage="Нет категорий расходов."
      errorFallback="Не удалось загрузить конверты"
    >
      {(items) =>
        items.map((item) => {
          const isSelected = selectedCategoryId === item.category.id;

          return (
            <li
              key={item.category.id}
              className={cn(
                'flex w-full min-w-0 flex-col',
                listItemHighlightBaseClassName,
                isSelected && listItemHighlightActiveClassName,
              )}
            >
              <CategoryBudgetCard
                item={item}
                stressOverBudget={stressCategoryId === item.category.id}
                onSelect={onCategorySelect}
                action={renderItemAction?.(item)}
              />
            </li>
          );
        })
      }
    </ItemsList>
  );
}
