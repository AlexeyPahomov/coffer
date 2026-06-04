/** Ключ месяца `YYYY-MM` из ISO-даты или `period_month`. */
export function getMonthKeyFromIso(iso: string): string | undefined {
  const normalized = iso.length === 7 ? `${iso}-01` : iso.slice(0, 10)
  const match = /^(\d{4})-(\d{2})/.exec(normalized)
  if (!match) {
    return undefined
  }
  const month = Number(match[2])
  if (month < 1 || month > 12) {
    return undefined
  }
  return `${match[1]}-${match[2]}`
}

export function parsePeriodMonthKey(
  periodMonth: string,
): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(periodMonth)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return null
  }
  return { year, month }
}

export function isSamePeriodMonth(
  isoOrMonth: string,
  periodMonth: string,
): boolean {
  return getMonthKeyFromIso(isoOrMonth) === periodMonth
}

export function isBeforePeriodMonth(
  isoOrMonth: string,
  periodMonth: string,
): boolean {
  const monthKey = getMonthKeyFromIso(isoOrMonth)

  return monthKey != null && monthKey < periodMonth
}

export function getPreviousPeriodMonth(
  periodMonth: string,
): string | undefined {
  const parsed = parsePeriodMonthKey(periodMonth)
  if (!parsed) {
    return undefined
  }

  const date = new Date(parsed.year, parsed.month - 2, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getNextPeriodMonth(
  periodMonth: string,
): string | undefined {
  const parsed = parsePeriodMonthKey(periodMonth)
  if (!parsed) {
    return undefined
  }

  const date = new Date(parsed.year, parsed.month, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Непрерывный диапазон месяцев от start до end включительно. */
export function buildPeriodMonthRange(
  startMonth: string,
  endMonth: string,
): string[] {
  const months: string[] = []
  let current: string | undefined = startMonth

  while (current && current <= endMonth) {
    months.push(current)
    current = getNextPeriodMonth(current)
  }

  return months
}

/** `YYYY-MM` из даты (локальный календарь). */
export function monthValueFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
