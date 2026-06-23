export const plannedExpenseListClassName =
  'flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-card';

export const plannedExpenseListHeaderClassName =
  'shrink-0 border-b border-zinc-200/80 bg-card px-4 py-3';

export const plannedExpenseListBodyClassName =
  'coffer-scroll-list min-h-0 flex-1 overflow-y-auto overscroll-y-contain [overflow-anchor:none] [scrollbar-gutter:auto] pe-0.5';

export const plannedExpenseListHeaderTitleClassName =
  'text-base font-semibold text-zinc-900';

export const plannedExpenseCardClassName =
  'relative border-b border-zinc-200/80 px-4 py-3.5 last:border-b-0';

export const plannedExpenseCardRowClassName =
  'flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4';

export const plannedExpenseCardMainClassName =
  'flex min-w-0 flex-1 items-center gap-3 pr-4 sm:min-w-[9rem] sm:pr-0';

/** Сумма → статус → дата на мобилке; + иконка источника на sm+. */
export const plannedExpenseCardDetailsClassName =
  'grid w-full shrink-0 items-center gap-x-3 sm:ml-auto sm:w-max sm:gap-x-4 [grid-template-columns:minmax(3rem,max-content)_max-content_minmax(0,1fr)] sm:[grid-template-columns:2rem_5rem_6rem_9rem]';

/** Иконка источника в строке деталей (десктоп). */
export const plannedExpenseCardSourceClassName =
  'hidden size-8 items-center justify-center justify-self-center sm:flex';

/** Иконка источника в правом верхнем углу (мобилка). */
export const plannedExpenseCardSourceMobileClassName =
  'absolute right-4 top-3.5 z-[1] flex size-2 items-center justify-center sm:hidden';

export const plannedExpenseCardTextClassName = 'min-w-0 flex-1';

export const plannedExpenseCardTitleClassName =
  'truncate text-base font-semibold leading-tight text-zinc-900';

export const plannedExpenseCardDescriptionClassName =
  'w-full text-sm text-zinc-500';

export const plannedExpenseCardFinanceClassName =
  'flex min-h-8 flex-col items-end justify-center gap-1 justify-self-end';

export const plannedExpenseCardAmountClassName =
  'whitespace-nowrap text-sm font-bold tabular-nums leading-none text-zinc-900 sm:text-base';

export const plannedExpenseCardProgressTextClassName =
  'text-xs tabular-nums text-zinc-500';

export const plannedExpenseCardDateClassName =
  'min-w-0 justify-self-stretch whitespace-nowrap text-right text-xs leading-snug tabular-nums text-zinc-500 sm:justify-self-end sm:whitespace-normal sm:text-sm';

export const plannedExpenseCardStatusClassName =
  'flex items-center justify-self-start';

/** Пункт «Зарезервировать» в дропдауне карточки. */
export const plannedExpenseReserveMenuItemClassName =
  'w-full justify-start gap-2 text-orange hover:bg-orange-muted hover:text-orange-hover';

/** Пункт «Снять резерв» в дропдауне карточки. */
export const plannedExpenseUnreserveMenuItemClassName =
  'w-full justify-start gap-2 text-blue hover:bg-blue-muted hover:text-blue-hover';

/** Кликабельный тег статуса «План». */
export const plannedExpensePlannedBadgeClassName =
  'rounded-md bg-blue-subtle text-blue hover:bg-blue-muted disabled:pointer-events-none disabled:opacity-50';

/** Неактивный тег «План». */
export const plannedExpensePlannedBadgeStaticClassName =
  'rounded-md bg-blue-subtle text-blue';

/** Кликабельный тег статуса «Резерв». */
export const plannedExpenseReservedBadgeClassName =
  'rounded-md bg-orange-subtle text-orange hover:bg-orange-muted disabled:pointer-events-none disabled:opacity-50';

/** Неактивный тег «Резерв». */
export const plannedExpenseReservedBadgeStaticClassName =
  'rounded-md bg-orange-subtle text-orange';

/** Кликабельный тег статуса «Выполнено». */
export const plannedExpenseCompletedBadgeClassName =
  'rounded-md bg-green-subtle text-green hover:bg-green-muted disabled:pointer-events-none disabled:opacity-50';

/** Неактивный тег «Выполнено». */
export const plannedExpenseCompletedBadgeStaticClassName =
  'rounded-md bg-green-subtle text-green';
