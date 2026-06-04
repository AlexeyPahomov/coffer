import { getMonthKeyFromIso } from '@coffer/shared'

import type { Income } from '@/entities/income/model/types'
import { monthValueFromDate } from '@/shared/lib/date'

export function getIncomePeriodMonth(income: Income): string {
  return getMonthKeyFromIso(income.period_month) ?? income.period_month
}

/** Календарный месяц для пикеров: `YYYY-MM` от текущей (или переданной) даты. */
export function resolveCurrentCalendarPeriodMonth(
  referenceDate: Date = new Date(),
): string {
  return monthValueFromDate(referenceDate)
}

/**
 * @deprecated Используйте `resolveCurrentCalendarPeriodMonth`. Первый аргумент не используется.
 */
export function resolveAccountingPeriodMonth(
  _incomes?: readonly Income[],
  referenceDate: Date = new Date(),
): string {
  return resolveCurrentCalendarPeriodMonth(referenceDate)
}
