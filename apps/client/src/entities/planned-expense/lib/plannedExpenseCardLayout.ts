export const plannedExpenseListClassName =
  'flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-card'

export const plannedExpenseListHeaderClassName =
  'shrink-0 border-b border-zinc-200/80 bg-card px-4 py-3'

export const plannedExpenseListBodyClassName =
  'coffer-scroll-list min-h-0 flex-1 overflow-y-auto overscroll-y-contain [overflow-anchor:none] [scrollbar-gutter:auto] pe-0.5'

export const plannedExpenseListHeaderTitleClassName =
  'text-base font-semibold text-zinc-900'

export const plannedExpenseCardClassName =
  'border-b border-zinc-200/80 px-4 py-3.5 last:border-b-0'

export const plannedExpenseCardRowClassName =
  'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'

/** Сумма и статус: одна строка на мобилке, на десктопе — части общего flex-ряда. */
export const plannedExpenseCardMetaClassName =
  'flex w-full items-center justify-between gap-3 sm:contents'

export const plannedExpenseCardMainClassName = 'flex min-w-0 flex-1 items-center gap-3'

export const plannedExpenseCardTextClassName = 'min-w-0 flex-1'

export const plannedExpenseCardTitleClassName =
  'truncate text-base font-semibold leading-tight text-zinc-900'

export const plannedExpenseCardDescriptionClassName =
  'w-full text-sm text-zinc-500'

export const plannedExpenseCardFinanceClassName =
  'flex min-w-0 shrink-0 flex-col items-start gap-1 sm:w-36 sm:items-end'

export const plannedExpenseCardAmountClassName =
  'text-base font-bold tabular-nums leading-none text-zinc-900'

export const plannedExpenseCardProgressTextClassName =
  'text-xs tabular-nums text-zinc-500'

export const plannedExpenseCardDateClassName =
  'hidden shrink-0 text-sm text-zinc-500 md:block md:w-32 lg:w-36'

export const plannedExpenseCardStatusClassName =
  'shrink-0 sm:ml-0 sm:w-24'

/** Пункт «Зарезервировать» в дропдауне карточки. */
export const plannedExpenseReserveMenuItemClassName =
  'w-full justify-start gap-2 text-orange hover:bg-orange-muted hover:text-orange-hover'

/** Пункт «Снять резерв» в дропдауне карточки. */
export const plannedExpenseUnreserveMenuItemClassName =
  'w-full justify-start gap-2 text-blue hover:bg-blue-muted hover:text-blue-hover'

/** Кликабельный тег статуса «План». */
export const plannedExpensePlannedBadgeClassName =
  'rounded-md bg-blue-subtle text-blue hover:bg-blue-muted disabled:pointer-events-none disabled:opacity-50'

/** Неактивный тег «План». */
export const plannedExpensePlannedBadgeStaticClassName =
  'rounded-md bg-blue-subtle text-blue'

/** Кликабельный тег статуса «Резерв». */
export const plannedExpenseReservedBadgeClassName =
  'rounded-md bg-orange-subtle text-orange hover:bg-orange-muted disabled:pointer-events-none disabled:opacity-50'

/** Неактивный тег «Резерв». */
export const plannedExpenseReservedBadgeStaticClassName =
  'rounded-md bg-orange-subtle text-orange'

/** Кликабельный тег статуса «Выполнено». */
export const plannedExpenseCompletedBadgeClassName =
  'rounded-md bg-green-subtle text-green hover:bg-green-muted disabled:pointer-events-none disabled:opacity-50'

/** Неактивный тег «Выполнено». */
export const plannedExpenseCompletedBadgeStaticClassName =
  'rounded-md bg-green-subtle text-green'
