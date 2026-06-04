import type { Income } from '@/entities/income/model/types'
import {
  getIncomePeriodMonth,
  resolveAccountingPeriodMonth,
} from '@/entities/income/lib/incomePeriodMonth'

import type { IncomeCardView } from './allocationIncomeCard'

export function resolveDefaultAllocationPeriodMonth(
  incomeCards: IncomeCardView[],
  incomes: readonly Income[],
): string {
  const currentMonth = resolveAccountingPeriodMonth(incomes)
  const currentMonthCard = incomeCards.find((card) => card.id === currentMonth)
  if (currentMonthCard) {
    return currentMonthCard.id
  }

  const latestPastOrCurrent = incomeCards
    .filter((card) => card.id <= currentMonth)
    .sort((a, b) => b.id.localeCompare(a.id))[0]
  if (latestPastOrCurrent) {
    return latestPastOrCurrent.id
  }

  return [...incomeCards].sort((a, b) => a.id.localeCompare(b.id))[0].id
}

export function resolveSelectedAllocationPeriodMonth(
  incomeCards: IncomeCardView[],
  incomes: readonly Income[],
  pickedPeriodMonth: string | null,
): string | null {
  if (incomeCards.length === 0) {
    return null
  }
  if (
    pickedPeriodMonth !== null &&
    incomeCards.some((card) => card.id === pickedPeriodMonth)
  ) {
    return pickedPeriodMonth
  }
  return resolveDefaultAllocationPeriodMonth(incomeCards, incomes)
}

export function filterIncomesByPeriodMonth(
  incomes: readonly Income[],
  periodMonth: string | null,
): Income[] {
  if (periodMonth === null) {
    return []
  }

  return incomes.filter(
    (income) => getIncomePeriodMonth(income) === periodMonth,
  )
}
