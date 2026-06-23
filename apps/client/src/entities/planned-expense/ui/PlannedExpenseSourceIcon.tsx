import { Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import type { Category } from '@/entities/category/model/types';
import { CategoryListIcon } from '@/entities/category/ui/CategoryListIcon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';

import { FREE_POOL_SOURCE_LABEL } from '@/entities/planned-expense/lib/resolvePlannedExpenseCategory'

type PlannedExpenseSourceIconProps = {
  category?: Category | null;
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

/** Иконка источника плана: категория или свободный пул (без подписи). */
export function PlannedExpenseSourceIcon({
  category,
}: PlannedExpenseSourceIconProps) {
  const label = category?.name ?? FREE_POOL_SOURCE_LABEL;

  return (
    <SourceIconTooltip label={label}>
      {category ? (
        <CategoryListIcon
          category={category}
          iconClassName="size-3 sm:size-4"
        />
      ) : (
        <Wallet
          className="size-3 text-teal sm:size-4"
          strokeWidth={2}
          aria-hidden
        />
      )}
    </SourceIconTooltip>
  );
}
