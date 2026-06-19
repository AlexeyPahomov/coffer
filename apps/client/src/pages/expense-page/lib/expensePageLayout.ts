import { cn } from '@/shared/lib/utils'
import { mobilePageScrollShellClassName } from '@/shared/lib/mobilePageScrollShell'
import { scrollAreaClassName } from '@/shared/lib/scrollLayout'
import { mobileFabScrollReserveClassName } from '@/shared/ui/fab'

/** MonthPicker в шапке страницы. */
export const expensePageMonthPickerClassName =
  'w-auto [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:rounded-lg [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:px-2.5 [&_[data-slot=select-trigger]]:text-base [&_[data-slot=select-trigger]]:font-semibold hover:[&_[data-slot=select-trigger]]:bg-zinc-100'

export const expensePageMonthPickerIconClassName =
  'size-4 shrink-0 text-zinc-500 opacity-60'

export const expensePageToolbarClassName =
  'max-md:flex-col max-md:items-stretch'

/** Меньше зазор между month picker и контентом страницы на мобилке. */
export const expensePageSectionClassName = 'max-md:gap-2'

/** Сводка метрик: inset под ring; справа pe-2 (у shell на мобилке pe-0). */
export const expensePageBudgetSectionClassName = cn(
  'shrink-0',
  'ps-px pe-px max-md:pe-2 md:ps-0.5 md:pe-0.5 md:pt-0.5',
)

/** Оболочка страницы: метрики фиксированы, скролл — в активном табе. */
export const expensePageShellClassName = mobilePageScrollShellClassName({
  className: cn(
    'gap-4 max-md:gap-2',
    'overflow-hidden overscroll-none pb-0 pe-0',
  ),
})

/** Область табов без скролла страницы. */
export const expensePageShellWorkScrollClassName = cn(
  'flex min-h-0 flex-1 flex-col overflow-hidden',
)

/** Скролл только тела активного таба (под шапкой табов). */
export const expensePageTabPanelScrollClassName = cn(
  'flex h-full min-h-0 w-full min-w-0 flex-col',
  scrollAreaClassName,
  mobileFabScrollReserveClassName,
  'overflow-y-auto overscroll-y-auto',
  'max-md:ps-px max-md:pt-0 max-md:pe-2 max-md:pb-8',
  'max-md:[&_ul>li]:ring-offset-0',
  'md:pt-0.5 md:ps-px md:pe-0',
)

/** Список внутри вкладки — меньше зазор между шапкой и телом. */
export const expensePageListInTabClassName = 'gap-1'

/**
 * Отступ от табов до списка, если шапки ItemsList нет
 * (компактнее прежнего gap-3 у скрытого заголовка).
 */
export const expensePageTabListTopInsetClassName = 'max-md:pt-1.5'

/** Оболочка списка в табе: не задаёт высоту, чтобы скролл был у панели. */
export const expensePageTabListShellClassName =
  'flex w-full flex-col overflow-visible'

export const expensePageTabListShellWithTopInsetClassName = cn(
  expensePageTabListShellClassName,
  expensePageTabListTopInsetClassName,
)

export type ExpensePageWorkPanelSlide = 'categories' | 'history'

export function getExpensePagePanelClassName(inTab: boolean) {
  return inTab
    ? expensePageTabPanelScrollClassName
    : 'flex min-h-0 min-w-0 flex-col'
}

export function getExpensePageHistoryListClassName(inTab: boolean) {
  return inTab ? expensePageListInTabClassName : ''
}

export function getExpensePageShellClassName(className?: string) {
  return cn(expensePageShellClassName, className)
}
