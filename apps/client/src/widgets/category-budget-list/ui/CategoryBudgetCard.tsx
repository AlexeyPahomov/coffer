import type { ReactNode } from 'react';

import { isSavingsCategory } from '@/entities/category/lib/categoryKind';
import { formatAmount } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, Progress } from '@/shared/ui';

import { CategoryLucideIcon } from '@/entities/category/lib/categoryIcon';
import { toCategoryLucideIconProps } from '@/entities/category/lib/categoryLucideIconProps';

import { categoryIconWrapClassName } from '../lib/categoryVisual';
import {
  envelopeBalanceToneClassName,
  envelopeCardToneClassName,
  envelopeHoverToneClassName,
  envelopeProgressIndicatorClassName,
  formatEnvelopeBalance,
  getEnvelopeBalanceLabel,
  getEnvelopeBalanceTone,
} from '../lib/envelopeBalanceTone';
import {
  getEnvelopeBudgetTotal,
  hasEnvelopeLimit,
} from '@/entities/budget/lib/envelope';

import { getEnvelopeUsage } from '../lib/envelopeUsage';
import type { CategoryBudgetListItem } from '../model/types';

import {
  categoryBudgetCardContentClassName,
  categoryBudgetCardFooterBalanceClassName,
  categoryBudgetCardFooterClassName,
  categoryBudgetCardFooterLabelClassName,
  categoryBudgetCardHeaderRowClassName,
  categoryBudgetCardIconGlyphClassName,
  categoryBudgetCardIconWrapSizeClassName,
  categoryBudgetCardProgressClassName,
  categoryBudgetCardShellClassName,
  categoryBudgetCardTitleClassName,
} from '../lib/categoryBudgetCardLayout';
import { getCategoryBudgetCardDomProps } from '../lib/categoryBudgetCardTarget';

import { SavingsCategoryBudgetCard } from './SavingsCategoryBudgetCard';

type CategoryBudgetCardProps = {
  item: CategoryBudgetListItem;
  stressOverBudget?: boolean;
  onSelect?: (categoryId: string) => void;
  /** Доп. действие в футере (например, «вернуть в накопления»); рендерится как есть. */
  action?: ReactNode;
};

export function CategoryBudgetCard({
  item,
  stressOverBudget = false,
  onSelect,
  action,
}: CategoryBudgetCardProps) {
  const { category, spent, remaining } = item;
  const isSavings = isSavingsCategory(category.type);

  if (isSavings) {
    return <SavingsCategoryBudgetCard item={item} onSelect={onSelect} />;
  }

  const envelopeTotal = getEnvelopeBudgetTotal(item);
  const fromFreePool = !hasEnvelopeLimit(item) && spent > 0;
  const tone = getEnvelopeBalanceTone(
    envelopeTotal,
    remaining,
    stressOverBudget,
  );
  const usage = getEnvelopeUsage(envelopeTotal, spent);
  const balanceLabel = fromFreePool ? 'Источник' : getEnvelopeBalanceLabel(isSavings);
  const usageCaption = fromFreePool
    ? 'траты из свободных средств'
    : 'использовано из фактического конверта';

  return (
    <Card
      size="sm"
      {...getCategoryBudgetCardDomProps()}
      className={cn(
        categoryBudgetCardShellClassName,
        'transition-colors',
        envelopeCardToneClassName(tone),
        onSelect && 'cursor-pointer',
        onSelect && envelopeHoverToneClassName(tone),
      )}
      onClick={onSelect ? () => onSelect(category.id) : undefined}
    >
      <CardContent className={categoryBudgetCardContentClassName}>
        <div className={categoryBudgetCardHeaderRowClassName}>
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full',
              categoryBudgetCardIconWrapSizeClassName,
              categoryIconWrapClassName(tone),
            )}
          >
            <CategoryLucideIcon
              {...toCategoryLucideIconProps(category)}
              className={categoryBudgetCardIconGlyphClassName}
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className={categoryBudgetCardTitleClassName}>
              {category.name}
            </h3>
          </div>
          <div className="shrink-0 text-right text-sm tabular-nums leading-snug">
            <p className="font-medium text-zinc-900">
              {formatAmount(spent)}
              {fromFreePool ? null : (
                <>
                  <span className="mx-1 font-normal text-zinc-400">/</span>
                  {formatAmount(envelopeTotal)}
                </>
              )}
            </p>
            <p
              className={cn(
                'text-xs font-semibold',
                envelopeBalanceToneClassName(tone),
              )}
            >
              {fromFreePool ? 'свободные средства' : `${usage.displayPercent}%`}
            </p>
          </div>
        </div>

        <Progress
          value={usage.barPercent}
          className={categoryBudgetCardProgressClassName}
          indicatorClassName={envelopeProgressIndicatorClassName(tone)}
          aria-label={`${usageCaption}: ${usage.displayPercent}%`}
        />

        <div className={categoryBudgetCardFooterClassName}>
          <span className={categoryBudgetCardFooterLabelClassName}>
            {balanceLabel}
          </span>
          <span
            className={cn(
              categoryBudgetCardFooterBalanceClassName,
              envelopeBalanceToneClassName(tone),
            )}
          >
            {fromFreePool ? 'Свободные средства' : formatEnvelopeBalance(remaining)}
          </span>
        </div>

        {action ? <div className="flex justify-end">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
