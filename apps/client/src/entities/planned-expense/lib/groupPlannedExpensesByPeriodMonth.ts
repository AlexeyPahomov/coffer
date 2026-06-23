import type { PlannedExpense } from '../model/types'
import { resolveIconColorTone } from '@/shared/lib/iconColorStyles'

export function filterPlannedExpensesByPeriodMonth(
  items: readonly PlannedExpense[],
  periodMonth: string,
): PlannedExpense[] {
  return items.filter((item) => item.period_month === periodMonth)
}

export function groupPlannedExpensesByPeriodMonth(
  items: readonly PlannedExpense[],
): Map<string, PlannedExpense[]> {
  const groups = new Map<string, PlannedExpense[]>()

  for (const item of items) {
    const group = groups.get(item.period_month)

    if (group) {
      group.push(item)
      continue
    }

    groups.set(item.period_month, [item])
  }

  return groups
}

export function countPlannedExpensesByPeriodMonth(
  items: readonly PlannedExpense[],
): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const item of items) {
    counts[item.period_month] = (counts[item.period_month] ?? 0) + 1
  }

  return counts
}

export function collectPlannedExpenseSwatchesByPeriodMonth(
  items: readonly PlannedExpense[],
): Record<string, string[]> {
  const swatchesByMonth: Record<string, string[]> = {}

  for (const item of items) {
    if (swatchesByMonth[item.period_month] == null) {
      swatchesByMonth[item.period_month] = []
    }

    swatchesByMonth[item.period_month].push(
      resolveIconColorTone(item.icon_color).swatchClassName,
    )
  }

  return swatchesByMonth
}
