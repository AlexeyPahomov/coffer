import { monthValueFromDate, parseMonthStringToDate } from '@/shared/lib/date'

function addMonths(date: Date, monthDelta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthDelta, 1)
}

function buildMonthRange(start: Date, end: Date): string[] {
  const options: string[] = []
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endTime = end.getTime()

  while (cursor.getTime() <= endTime) {
    options.push(monthValueFromDate(cursor))
    cursor = addMonths(cursor, 1)
  }

  return options
}

/** Месяцы (`YYYY-MM`) на `spanMonths` назад и вперёд от `anchorPeriodMonth`. */
export function buildPeriodMonthRange(
  anchorPeriodMonth: string,
  spanMonths = 24,
): string[] {
  const anchorDate = parseMonthStringToDate(anchorPeriodMonth) ?? new Date()

  return buildMonthRange(
    addMonths(anchorDate, -spanMonths),
    addMonths(anchorDate, spanMonths),
  )
}
