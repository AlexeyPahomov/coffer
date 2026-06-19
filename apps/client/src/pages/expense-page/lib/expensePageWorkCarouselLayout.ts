import type { CarouselOptions } from '@/shared/ui/carousel/carousel-context';

import { cn } from '@/shared/lib/utils';

export const expensePageWorkCarouselOptions: CarouselOptions = {
  align: 'start',
  containScroll: 'trimSnaps',
  skipSnaps: false,
};

/** Табы + карусель: вторая строка забирает оставшуюся высоту. */
export const expensePageWorkCarouselRootClassName =
  'grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]';

export const expensePageWorkCarouselViewportClassName = cn(
  'min-h-0 h-full overflow-hidden',
  'md:flex md:min-h-0 md:flex-1 md:flex-col',
  '[&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]]:min-h-0',
  '[&_[data-slot=carousel-content]>div]:h-full [&_[data-slot=carousel-content]>div]:min-h-0',
);

export const expensePageWorkCarouselContentClassName =
  'ml-0 flex h-full min-h-0 items-stretch';

export const expensePageWorkCarouselItemClassName =
  'h-full min-h-0 min-w-0 shrink-0 grow-0 basis-full self-stretch pl-0 md:flex md:flex-col';

/** Шапка табов и кнопки добавления — вне скролла списка. */
export const expensePageWorkSwitcherBarClassName =
  'relative z-10 w-full min-h-8 shrink-0 px-px pe-2 pb-1 md:min-h-9 md:pe-0 md:pb-3';

/** Сегментированный переключатель: компактная ширина по содержимому. */
export const expensePageWorkSwitcherClassName =
  'inline-flex w-auto max-w-full gap-0.5 rounded-xl bg-zinc-100/90 p-0.5 shadow-sm';

export const expensePageWorkSwitcherButtonClassName =
  'h-8 min-h-8 rounded-lg border-0 px-3 text-xs font-medium whitespace-nowrap shadow-none sm:text-sm';

/** Десктоп: кнопка поверх правого края шапки, не растягивает табы. */
export const expensePageWorkAddButtonClassName =
  'absolute top-0 right-0 z-10 hidden shrink-0 md:inline-flex';

export const expensePageWorkSwitcherButtonActiveClassName =
  'bg-white font-semibold text-zinc-900 shadow-none hover:bg-white';
