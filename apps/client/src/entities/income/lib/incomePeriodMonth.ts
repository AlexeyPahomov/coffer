import { getMonthKeyFromIso } from '@coffer/shared'

import type { Income } from '@/entities/income/model/types'
import { dateInputValueFromDate, monthValueFromDate } from '@/shared/lib/date'

export function getIncomePeriodMonth(income: Income): string {
  return getMonthKeyFromIso(income.period_month) ?? income.period_month
}

function previousMonthValue(value: string): string {
  const [yearPart, monthPart] = value.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  const date = new Date(year, month - 2, 1)

  return monthValueFromDate(date)
}

function incomeDateInputValue(income: Income): string | null {
  const value = income.period_month.slice(0, 10)

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

export function resolveAccountingPeriodMonth(
  incomes: readonly Income[],
  referenceDate: Date = new Date(),
): string {
  const currentMonth = monthValueFromDate(referenceDate)
  if (incomes.length === 0) {
    return currentMonth
  }

  const today = dateInputValueFromDate(referenceDate)
  const hasCurrentMonthIncome = incomes.some((income) => {
    const incomeDate = incomeDateInputValue(income)

    return (
      incomeDate !== null &&
      getIncomePeriodMonth(income) === currentMonth &&
      incomeDate <= today
    )
  })

  return hasCurrentMonthIncome ? currentMonth : previousMonthValue(currentMonth)
}
