import type { PlanFundingSources } from './buildPlanningSummary'

export const FUNDING_SOURCES: readonly {
  key: keyof PlanFundingSources
  label: string
  /** Цвет сегмента/маркера источника. */
  className: string
}[] = [
  { key: 'savings', label: 'Из накоплений', className: 'bg-emerald-500' },
  { key: 'pool', label: 'Из свободного пула', className: 'bg-sky-500' },
  { key: 'envelope', label: 'Из конвертов', className: 'bg-amber-500' },
]

/** Компактная сумма для подписей графика: 50 000 → «50к». */
export function formatCompactAmount(value: number): string {
  if (Math.abs(value) < 1000) {
    return String(Math.round(value))
  }
  return `${Math.round(value / 1000)}к`
}

export function sharePercent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function pluralRu(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) {
    return one
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few
  }
  return many
}
