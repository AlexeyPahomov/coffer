import { formatPeriodMonthLabel } from '@/entities/budget/lib/periodLabels'
import type { Income } from '@/entities/income/model/types'
import { toMoneyNumber } from '@/shared/lib/money'

import { currentMonthInputValue } from '@/shared/lib/date'

import { getIncomePeriodMonth, resolveCurrentCalendarPeriodMonth } from './incomePeriodMonth'

export type IncomeMonthCardView = {
  id: string
  periodMonth: string
  periodLabel: string
  amount: number
}

export function buildIncomeMonthCards(
  incomes: readonly Income[],
): IncomeMonthCardView[] {
  const byMonth = new Map<string, number>()

  for (const income of incomes) {
    const periodMonth = getIncomePeriodMonth(income)
    const amount = toMoneyNumber(income.amount)
    byMonth.set(periodMonth, (byMonth.get(periodMonth) ?? 0) + amount)
  }

  return [...byMonth.entries()]
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([periodMonth, amount]) => ({
      id: periodMonth,
      periodMonth,
      periodLabel: formatPeriodMonthLabel(periodMonth, { omitYear: true }),
      amount,
    }))
}

function compareIncomeByDateDesc(a: Income, b: Income): number {
  const byPeriod = b.period_month.localeCompare(a.period_month)
  if (byPeriod !== 0) {
    return byPeriod
  }

  return b.created_at.localeCompare(a.created_at)
}

export function sortIncomesByDateDesc(incomes: readonly Income[]): Income[] {
  return [...incomes].sort(compareIncomeByDateDesc)
}

export function filterIncomesByPeriodMonth(
  incomes: readonly Income[],
  periodMonth: string,
): Income[] {
  return sortIncomesByDateDesc(
    incomes.filter((income) => getIncomePeriodMonth(income) === periodMonth),
  )
}

export function countIncomesByPeriodMonth(
  incomes: readonly Income[],
): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const income of incomes) {
    const key = getIncomePeriodMonth(income)
    counts[key] = (counts[key] ?? 0) + 1
  }

  return counts
}

export function resolveDefaultIncomePeriodMonth(
  monthCards: IncomeMonthCardView[],
): string | null {
  if (monthCards.length === 0) {
    return null
  }

  const currentMonth = resolveCurrentCalendarPeriodMonth()
  const currentMonthCard = monthCards.find((card) => card.id === currentMonth)
  if (currentMonthCard) {
    return currentMonthCard.id
  }

  const latestPastOrCurrent = monthCards
    .filter((card) => card.id <= currentMonth)
    .sort((a, b) => b.id.localeCompare(a.id))[0]
  if (latestPastOrCurrent) {
    return latestPastOrCurrent.id
  }

  return monthCards[monthCards.length - 1]?.id ?? null
}

export function resolveSelectedIncomePeriodMonth(
  monthCards: IncomeMonthCardView[],
  pickedPeriodMonth: string | null,
): string {
  if (pickedPeriodMonth) {
    return pickedPeriodMonth
  }

  return (
    resolveDefaultIncomePeriodMonth(monthCards) ??
    currentMonthInputValue()
  )
}
