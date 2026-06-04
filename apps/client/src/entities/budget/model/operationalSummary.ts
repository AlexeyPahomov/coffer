import type { ReserveCategorySummary } from './types'

/** Операционная сводка за выбранный месяц (dashboard truth). */
export type OperationalSummary = {
  periodMonth: string
  periodLabel: string
  /** Свободные средства (пул без конверта, с переносом между месяцами). */
  available: number
  /** Остаток по категориям накоплений (sinking / savings). */
  inReserve: number
  /** Категория накоплений для блока «Накопления». */
  reserveCategory?: ReserveCategorySummary
  /** Сумма доходов с датой в этом месяце. */
  incomeTotal: number
  /** Сумма распределений по категориям в этом месяце. */
  allocatedTotal: number
  /** Сумма расходов с датой в этом месяце. */
  spentThisMonth: number
  /** Сумма opening balance по всем конвертам. */
  carryForwardTotal: number
  /** Подпись предыдущего месяца для UX переноса. */
  previousPeriodLabel?: string
  /** Сумма планов со статусом PLANNED. */
  plannedTotal: number
  /** Сумма планов со статусом RESERVED. */
  reservedTotal: number
  /** Прогноз свободного пула после планов и резерва. */
  projectedFree: number
}
