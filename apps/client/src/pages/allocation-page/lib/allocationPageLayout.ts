import { cn } from '@/shared/lib/utils'
import { pageScrollRingInsetClassName } from '@/shared/lib/scrollLayout'
import { mobileFabScrollReserveClassName } from '@/shared/ui/fab'

/** Оболочка страницы: на мобилке шапка фиксирована, скролл — только у списка. */
export const allocationPageShellClassName = cn(
  'flex min-h-0 flex-1 flex-col gap-6 max-md:gap-2',
  'max-md:overflow-hidden max-md:overscroll-none',
)

/** Область списка: скролл внутри ItemsList, не у оболочки (иначе обрезка карточек). */
export const allocationPageListScrollClassName =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'

/** Отступы и резерв под FAB у прокручиваемого `<ul>`. */
export const allocationPageListUlClassName = cn(
  pageScrollRingInsetClassName,
  'max-md:pe-2 max-md:pb-8',
  mobileFabScrollReserveClassName,
)

/** Десктоп: доходы слева, распределение справа — каждая колонка со своим скроллом. */
export const budgetPageColumnsClassName =
  'grid min-h-0 flex-1 grid-cols-2 grid-rows-[minmax(0,1fr)] gap-6'

export const budgetPageColumnClassName = 'flex h-full min-h-0 min-w-0 flex-col gap-2'

/** Пустой список доходов: те же отступы, что у `<ul>`, без кольца фокуса. */
/** Высота двух карточек дохода с зазором; отступ p-1 — как у списка. */
export const budgetAllocationListEmptyClassName = 'm-1 h-[125px] flex-none'

export const budgetIncomeListEmptyClassName = cn(
  'max-md:pe-2',
  mobileFabScrollReserveClassName,
)
