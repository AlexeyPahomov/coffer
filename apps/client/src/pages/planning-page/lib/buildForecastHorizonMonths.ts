import { getNextPeriodMonth } from '@coffer/shared'

/**
 * Месяцы горизонта прогноза: [periodMonth (сейчас), +1, …, +horizon].
 * Длина — horizon + 1; последний элемент — целевой месяц «через N».
 */
export function buildForecastHorizonMonths(
  periodMonth: string,
  horizon: number,
): string[] {
  const months = [periodMonth]
  let current = periodMonth

  for (let step = 0; step < horizon; step += 1) {
    const next = getNextPeriodMonth(current)
    if (!next) {
      break
    }
    months.push(next)
    current = next
  }

  return months
}
