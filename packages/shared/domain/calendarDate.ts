/** Календарная дата `YYYY-MM-DD` из ISO-строки или Date (без сдвига месяца по UTC). */
export function getCalendarDateKey(isoOrDate: string | Date): string | undefined {
  if (isoOrDate instanceof Date) {
    const y = isoOrDate.getFullYear()
    const m = String(isoOrDate.getMonth() + 1).padStart(2, '0')
    const d = String(isoOrDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const normalized =
    isoOrDate.length === 10 ? isoOrDate : isoOrDate.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized)
  if (!match) {
    return undefined
  }
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined
  }
  return normalized
}

export function isDateOnOrBefore(
  dateKey: string,
  asOfKey: string,
): boolean {
  return dateKey <= asOfKey
}

/** Интервал цикла: [cycleStart, cycleEnd) ∩ (−∞, asOf]. */
export function isDateInActiveCycle(
  dateKey: string,
  cycleStart: string,
  cycleEnd: string | null,
  asOfKey: string,
): boolean {
  if (dateKey < cycleStart) {
    return false
  }
  if (cycleEnd != null && dateKey >= cycleEnd) {
    return false
  }
  return dateKey <= asOfKey
}
