import { cn } from '@/shared/lib/utils'
import {
  pageScrollRingInsetClassName,
  safariIosFlexFillClassName,
} from '@/shared/lib/scrollLayout'
import { contentTransitionOutletShellClassName } from '@/shared/ui/content-transition/contentTransitionLayout'
import { mobileFabScrollReserveClassName } from '@/shared/ui/fab'

/** Оболочка страницы: на мобилке скролл только у списка планов; на md — вся страница. */
export const planningPageShellClassName = cn(
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden',
  'max-md:overflow-hidden max-md:overscroll-none',
  'md:gap-6 md:overflow-y-auto md:overscroll-y-auto',
  'md:coffer-scroll-list md:[overflow-anchor:none]',
  pageScrollRingInsetClassName,
  safariIosFlexFillClassName,
)

/** Тулбар месяцев + «Новый план» — липнет к верху scrollport на десктопе. */
export const planningPageToolbarStickyClassName = cn(
  'relative hidden min-w-0 shrink-0 md:sticky md:top-0 md:z-10 md:block',
  'md:-mx-1 md:bg-background md:px-1 md:pb-4 md:pt-0.5',
  "md:before:pointer-events-none md:before:absolute md:before:inset-x-0 md:before:-top-6 md:before:h-6 md:before:bg-background md:before:content-['']",
)

/** Смена месяца: на мобилке flex-область под шапкой; на md — блок в общем скролле. */
export const planningPageMonthTransitionClassName = cn(
  contentTransitionOutletShellClassName,
  'min-h-0 flex-1',
  'md:flex-none md:overflow-visible',
  safariIosFlexFillClassName,
)

/** Тело месяца: на мобилке без внешнего скролла; на md растёт вместе со страницей. */
export const planningPageMonthBodyClassName = cn(
  'flex min-h-0 flex-1 flex-col gap-4 max-md:min-h-0 max-md:gap-2',
  'max-md:overflow-hidden max-md:overscroll-none',
  'md:flex-none md:gap-6',
  'max-md:pe-0',
)

/** На мобилке — оставшаяся высота и скролл списка; на md — обычный блок в потоке страницы. */
export const planningPagePlansSectionClassName = cn(
  'flex min-h-0 flex-1 flex-col overflow-hidden',
  'max-md:min-h-0 max-md:basis-0',
  'md:flex-none md:overflow-visible',
)

export const planningPagePlannedListBodyClassName = cn(
  mobileFabScrollReserveClassName,
  'max-md:min-h-0 max-md:flex-1',
  'md:max-h-none md:flex-none md:overflow-visible',
)
