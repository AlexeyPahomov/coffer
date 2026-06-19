import type { CarouselOptions } from '@/shared/ui/carousel/carousel-context';

/**
 * Viewport карусели — занимает всё место между стрелками.
 */
export const planningMonthCarouselViewportClassName =
  'min-w-0 flex-1 overflow-hidden';

export const planningMonthTimelineClassName =
  'flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2';

/** Отступ между слайдами (flex gap на CarouselContent). */
export const planningMonthCarouselContentClassName = 'ml-0 gap-3 md:w-full';

/** Мобилка — фиксированная ширина и горизонтальный скролл; десктоп — равномерно на всю ширину. */
export const planningMonthCarouselItemClassName =
  'w-[7.25rem] shrink-0 basis-auto pl-0 md:w-auto md:min-w-0 md:flex-1 md:basis-0';

export const planningMonthCarouselOptions: CarouselOptions = {
  align: 'start',
  duration: 32,
  skipSnaps: false,
  containScroll: 'trimSnaps',
  slidesToScroll: 1,
}

/** Как на странице «Расходы»: кнопки outline / toolbar — rounded-lg. С md (планшет). */
export const planningMonthNavButtonClassName =
  'hidden size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 md:flex';

/** Карточка месяца в переключателе (rounded-lg, как Card / кнопки расходов). */
export function planningMonthCardClassName(active: boolean): string {
  const size =
    'w-full min-w-[7.25rem] flex-col items-center gap-0.5 px-3 py-1.5 text-center md:min-w-0 sm:px-4';

  return active
    ? `${size} rounded-lg border border-zinc-900 bg-zinc-900 text-white shadow-sm hover:border-zinc-900 hover:bg-zinc-900`
    : `${size} rounded-lg border border-zinc-200 bg-white text-zinc-900 transition-colors hover:bg-zinc-50`;
}
