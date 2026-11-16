import { Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import type { Category } from '@/entities/category/model/types';
import { CategoryListIcon } from '@/entities/category/ui/CategoryListIcon';
import { formatMoneyWithRub } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { IconColorAvatar, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';

import { FREE_POOL_SOURCE_LABEL } from '@/entities/planned-expense/lib/resolvePlannedExpenseCategory'

type PlannedExpenseSourceIconProps = {
  category?: Category | null;
  /** Конверт накоплений — вторая иконка поверх основной. */
  savingsCategory?: Category | null;
  amount: number;
  savingsAmount: number;
};

function SourceIconTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex size-5 cursor-default items-center justify-center sm:size-8"
          aria-label={label}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}

const sourceIconClassName = 'size-2.5 sm:size-3';

function SourceAvatar({
  iconColor,
  className,
  children,
}: {
  iconColor: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <IconColorAvatar
      iconColor={iconColor}
      className={cn('size-4 sm:size-6', className)}
    >
      {() => children}
    </IconColorAvatar>
  );
}

/**
 * Иконка источника плана: категория или свободный пул (без подписи).
 * Если часть суммы из накоплений — их иконка поверх основной; всё из накоплений — только она.
 */
export function PlannedExpenseSourceIcon({
  category,
  savingsCategory,
  amount,
  savingsAmount,
}: PlannedExpenseSourceIconProps) {
  const mainLabel = category?.name ?? FREE_POOL_SOURCE_LABEL;
  const fromSavings = savingsCategory != null && savingsAmount > 0;
  const mainAmount = Math.max(0, amount - savingsAmount);
  const showMain = !fromSavings || mainAmount > 0;

  const label = fromSavings
    ? [
        `${savingsCategory.name} ${formatMoneyWithRub(savingsAmount)}`,
        showMain ? `${mainLabel} ${formatMoneyWithRub(mainAmount)}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : mainLabel;

  return (
    <SourceIconTooltip label={label}>
      {showMain ? (
        <SourceAvatar iconColor={category ? category.icon_color : 'teal'}>
          {category ? (
            <CategoryListIcon
              category={category}
              iconClassName={sourceIconClassName}
            />
          ) : (
            <Wallet
              className={cn(sourceIconClassName, 'text-teal')}
              strokeWidth={2}
              aria-hidden
            />
          )}
        </SourceAvatar>
      ) : null}
      {fromSavings ? (
        <SourceAvatar
          iconColor={savingsCategory.icon_color}
          // Кольцо цвета карточки отделяет верхний кружок от нижнего.
          className={cn(showMain && '-ml-1.5 ring-2 ring-card sm:-ml-2')}
        >
          <CategoryListIcon
            category={savingsCategory}
            iconClassName={sourceIconClassName}
          />
        </SourceAvatar>
      ) : null}
    </SourceIconTooltip>
  );
}
