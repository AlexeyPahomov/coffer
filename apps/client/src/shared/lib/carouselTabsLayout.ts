import type { CarouselOptions } from '@/shared/ui/carousel/carousel-context'

import { cn } from '@/shared/lib/utils'

/** Свайп-карусель вкладок: слайды одинаковой ширины, без «резинки» по краям. */
export const carouselTabsOptions: CarouselOptions = {
  align: 'start',
  containScroll: 'trimSnaps',
  skipSnaps: false,
}

/** Корень области: шапка вкладок (auto) + карусель (оставшаяся высота). */
export const carouselTabsRootClassName =
  'grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]'

export const carouselTabsViewportClassName = cn(
  'min-h-0 h-full overflow-hidden',
  'md:flex md:min-h-0 md:flex-1 md:flex-col',
  '[&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]]:min-h-0',
  '[&_[data-slot=carousel-content]>div]:h-full [&_[data-slot=carousel-content]>div]:min-h-0',
)

export const carouselTabsContentClassName =
  'ml-0 flex h-full min-h-0 items-stretch'

export const carouselTabsItemClassName =
  'h-full min-h-0 min-w-0 shrink-0 grow-0 basis-full self-stretch pl-0 md:flex md:flex-col'
