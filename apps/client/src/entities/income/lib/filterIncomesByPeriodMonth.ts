import type { Income } from '@/entities/income/model/types'

import { getIncomePeriodMonth } from './incomePeriodMonth'

function incomeSortDate(income: Income): string {
  return income.received_at ?? income.created_at
}

function compareIncomeByDateAsc(a: Income, b: Income): number {
  const byPeriod = a.period_month.localeCompare(b.period_month)
  if (byPeriod !== 0) {
    return byPeriod
  }

  const byDate = incomeSortDate(a).localeCompare(incomeSortDate(b))
  if (byDate !== 0) {
    return byDate
  }

  return a.created_at.localeCompare(b.created_at)
}

export function sortIncomesByDateAsc(incomes: readonly Income[]): Income[] {
  return [...incomes].sort(compareIncomeByDateAsc)
}

export function filterIncomesByPeriodMonth(
  incomes: readonly Income[],
  periodMonth: string,
): Income[] {
  return sortIncomesByDateAsc(
    incomes.filter((income) => getIncomePeriodMonth(income) === periodMonth),
  )
}
