import { cn } from '@/shared/lib/utils'

/** Высота карточки конверта на md+. */
export const categoryBudgetCardHeightRem = 9.5

/** Компактная карточка конверта: 8.25rem на мобилке, 9.5rem на md+. */
export const categoryBudgetCardShellClassName = cn(
  'h-[8.25rem] w-full min-w-0 gap-0 overflow-hidden py-0',
  'md:h-[9.5rem]',
)

export const categoryBudgetCardContentClassName =
  'flex h-full min-h-0 flex-col justify-between gap-1 px-2.5 py-1.5 text-sm md:gap-1.5 md:px-3 md:py-2'

export const categoryBudgetCardHeaderRowClassName =
  'flex min-h-0 items-start gap-2 md:gap-2.5'

export const categoryBudgetCardIconWrapSizeClassName = 'size-8 md:size-9'

export const categoryBudgetCardIconGlyphClassName = 'size-3.5 md:size-4'

export const categoryBudgetCardTitleClassName =
  'truncate text-sm font-semibold leading-snug text-zinc-900 md:text-base'

export const categoryBudgetCardProgressClassName = 'h-1.5 bg-zinc-100 md:h-2'

export const categoryBudgetCardFooterClassName =
  'flex items-center justify-between gap-2 border-t border-zinc-100 pt-1 md:pt-1.5'

export const categoryBudgetCardFooterBalanceClassName =
  'text-sm font-bold tabular-nums md:text-base'

export const categoryBudgetCardFooterLabelClassName =
  'text-xs text-zinc-500 md:text-sm'

/** Карточка накоплений в той же сетке. */
export const savingsCategoryBudgetCardContentClassName =
  'flex h-full min-h-0 flex-col gap-2.5 p-3 md:gap-4 md:p-4'

export const savingsCategoryBudgetCardHeaderRowClassName =
  'flex items-start gap-2 md:gap-3'

export const savingsCategoryBudgetCardIconWrapClassName =
  'flex size-8 shrink-0 items-center justify-center rounded-full bg-green-subtle text-green md:size-10'

export const savingsCategoryBudgetCardIconGlyphClassName = 'size-4 md:size-5'

export const savingsCategoryBudgetCardAmountClassName =
  'text-xl font-bold leading-tight tracking-tight text-green tabular-nums md:text-2xl lg:text-3xl'

export const savingsCategoryBudgetCardTitleClassName =
  'truncate text-sm font-semibold leading-snug text-zinc-900 md:text-base'

export const savingsCategoryBudgetCardNoticeClassName =
  'flex items-center gap-2 rounded-xl bg-green-subtle px-2.5 py-2 text-xs text-green md:px-3 md:py-2.5 md:text-sm'

export const savingsCategoryBudgetCardNoticeIconClassName =
  'size-3.5 shrink-0 text-green md:size-4'
