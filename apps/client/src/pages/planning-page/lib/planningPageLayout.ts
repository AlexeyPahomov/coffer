import { cn } from '@/shared/lib/utils'
import {
  pageScrollRingInsetClassName,
  safariIosFlexFillClassName,
  scrollAreaClassName,
} from '@/shared/lib/scrollLayout'
import { contentTransitionOutletShellClassName } from '@/shared/ui/content-transition/contentTransitionLayout'
import { mobileFabScrollReserveClassName } from '@/shared/ui/fab'

/** Оболочка страницы: фиксированной высоты, скролл — в теле активной вкладки. */
export const planningPageShellClassName = cn(
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-none',
  'md:gap-6',
  safariIosFlexFillClassName,
)

/** Тулбар месяцев + «Новый план» — липнет к верху scrollport на десктопе. */
export const planningPageToolbarStickyClassName = cn(
  'relative hidden min-w-0 shrink-0 md:sticky md:top-0 md:z-10 md:block',
  'md:-mx-1 md:bg-background md:px-1 md:pb-4 md:pt-0.5',
  "md:before:pointer-events-none md:before:absolute md:before:inset-x-0 md:before:-top-6 md:before:h-6 md:before:bg-background md:before:content-['']",
)

/** Смена месяца: flex-область под шапкой, заполняет доступную высоту. */
export const planningPageMonthTransitionClassName = cn(
  contentTransitionOutletShellClassName,
  'min-h-0 flex-1',
  safariIosFlexFillClassName,
)

/** Тело месяца: фиксированный столбец (шапка вкладок + прокручиваемая панель). */
export const planningPageMonthBodyClassName = cn(
  'flex min-h-0 min-w-0 flex-1 flex-col gap-4 md:gap-6 max-md:gap-2',
)

/** Скролл только тела активной вкладки (слайд карусели). */
export const planningPageTabPanelScrollClassName = cn(
  'flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden',
  scrollAreaClassName,
  mobileFabScrollReserveClassName,
  pageScrollRingInsetClassName,
  'max-md:pe-2 max-md:pb-8',
)

/** Секция планов теперь всегда живёт в потоке тела месяца. */
export const planningPagePlansSectionClassName = cn(
  'flex min-h-0 flex-col overflow-hidden',
  'max-md:flex-none max-md:overflow-visible',
  'md:flex-none md:overflow-visible',
)

export const planningPagePlannedListBodyClassName = cn(
  'max-md:min-h-0 max-md:flex-none max-md:overflow-visible max-md:overscroll-auto',
  'md:max-h-none md:flex-none md:overflow-visible',
)
