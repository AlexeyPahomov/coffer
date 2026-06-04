import { getCalendarDateKey } from './calendarDate.js'
import { getMonthKeyFromIso } from './periodMonth.js'

/** Ключ учётного месяца `YYYY-MM` из Prisma `Date`. */
export function formatPeriodMonthKeyFromDate(date: Date): string {
  const key = getMonthKeyFromIso(date.toISOString())
  if (key) {
    return key
  }
  const calendar = getCalendarDateKey(date)
  return calendar ? calendar.slice(0, 7) : date.toISOString().slice(0, 7)
}

/** Календарная дата `YYYY-MM-DD` из Prisma `Date`. */
export function formatReceivedAtFromDate(date: Date): string {
  const key = getCalendarDateKey(date)
  return key ?? date.toISOString().slice(0, 10)
}

/** Дата «на сегодня» для расчёта цикла: query-параметр или текущий день. */
export function resolveBudgetAsOfKey(asOfParam?: string): string {
  const trimmed = asOfParam?.trim()
  if (trimmed) {
    const key = getCalendarDateKey(trimmed)
    if (key) {
      return key
    }
  }
  return formatReceivedAtFromDate(new Date())
}
