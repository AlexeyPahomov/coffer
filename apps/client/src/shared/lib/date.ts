/** Значение для `<input type="date">` на сегодня: `YYYY-MM-DD` (локальный календарь). */
export function todayDateInputValue(): string {
  return dateInputValueFromDate(new Date())
}

/** Парсинг `YYYY-MM-DD` в локальную дату. */
export function parseDateInputValue(value: string): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined
  }
  const [ys, ms, ds] = value.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return undefined
  }
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return undefined
  }
  return date
}

/** `YYYY-MM-DD` из даты (локальный календарь). */
export function dateInputValueFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Значение для `<input type="month">` для текущего месяца: `YYYY-MM`. */
export function currentMonthInputValue(): string {
  const d = new Date()
  return monthValueFromDate(d)
}

/** Первый день месяца из строки `YYYY-MM` (локальный календарь). */
export function parseMonthStringToDate(value: string): Date | undefined {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return undefined
  }
  const [ys, ms] = value.split('-')
  const y = Number(ys)
  const m = Number(ms)
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return undefined
  }
  return new Date(y, m - 1, 1)
}

/** Строка `YYYY-MM` для API/формы из даты (локальный месяц). */
export function monthValueFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** `YYYY-MM` из month-input → первый день месяца для API (`YYYY-MM-01`). */
export function monthInputToPeriodMonth(value: string): string {
  if (!value) {
    return ''
  }
  return `${value}-01`
}

const dateLongFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateDayMonthFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
})

function formatDateLong(d: Date): string {
  return dateLongFormatter.format(d)
}

function formatDateDayMonth(d: Date): string {
  return dateDayMonthFormatter.format(d)
}

/** ISO или `YYYY-MM-DD` → значение для date-input. */
export function isoToDateInputValue(isoDate: string): string {
  const parsed = parseDateInputValue(isoDate.slice(0, 10))
  if (parsed) {
    return dateInputValueFromDate(parsed)
  }
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate.slice(0, 10)
  }
  return dateInputValueFromDate(date)
}

function parseToLocalDate(value: string): Date | undefined {
  if (!value.trim()) {
    return undefined
  }
  const fromInput = parseDateInputValue(value)
  if (fromInput) {
    return fromInput
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** Конец интервала для API: `undefined`, если одна дата. */
export function normalizeDateRangeEnd(
  start: string,
  end: string,
): string | undefined {
  if (!end || end === start) {
    return undefined
  }
  return end
}

/** Подпись одной даты или интервала (форма, карточка). */
export function formatDateRangeLabel(
  start: string,
  end?: string | null,
  emptyLabel = 'Выберите дату',
): string {
  if (!start.trim()) {
    return emptyLabel
  }

  const startDate = parseToLocalDate(start)
  if (!startDate) {
    return start
  }

  if (!end) {
    return formatDateLong(startDate)
  }

  const endDate = parseToLocalDate(end)
  if (!endDate || dateInputValueFromDate(startDate) === dateInputValueFromDate(endDate)) {
    return formatDateLong(startDate)
  }

  return `${formatDateLong(startDate)} — ${formatDateLong(endDate)}`
}

/** Подпись даты/интервала без года (карточка плана в рамках месяца). */
export function formatDateRangeLabelWithoutYear(
  start: string,
  end?: string | null,
): string {
  if (!start.trim()) {
    return ''
  }

  const startDate = parseToLocalDate(start)
  if (!startDate) {
    return start
  }

  if (!end) {
    return formatDateDayMonth(startDate)
  }

  const endDate = parseToLocalDate(end)
  if (!endDate || dateInputValueFromDate(startDate) === dateInputValueFromDate(endDate)) {
    return formatDateDayMonth(startDate)
  }

  return `${formatDateDayMonth(startDate)} — ${formatDateDayMonth(endDate)}`
}
