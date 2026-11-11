import { getPreviousPeriodMonth } from '@coffer/shared'

import type { CreateIncomePayload, Income } from '@/entities/income/model/types'
import { toMoneyNumber } from '@/shared/lib/money'
import { dateInputValueFromDate, isoToDateInputValue } from '@/shared/lib/date'

import { filterIncomesByPeriodMonth } from './filterIncomesByPeriodMonth'

/** Та же дата в целевом месяце; день, которого там нет (31-е), — последний день месяца. */
function shiftDateToMonth(isoDate: string, periodMonth: string): string {
  const day = Number(isoToDateInputValue(isoDate).slice(8, 10))
  const [year, month] = periodMonth.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return dateInputValueFromDate(new Date(year, month - 1, Math.min(day, lastDay)))
}

/**
 * Доходы предыдущего месяца как ожидаемые в выбранном: та же сумма, источник,
 * тип и число месяца. Пустой массив — в прошлом месяце копировать нечего.
 */
export function copyIncomesFromPreviousMonth(
  incomes: readonly Income[],
  periodMonth: string,
): Omit<CreateIncomePayload, 'user_id'>[] {
  const previousMonth = getPreviousPeriodMonth(periodMonth)
  if (!previousMonth) {
    return []
  }

  return filterIncomesByPeriodMonth(incomes, previousMonth).map((income) => ({
    amount: toMoneyNumber(income.amount),
    source: income.source ?? undefined,
    income_type: income.income_type,
    status: 'EXPECTED',
    period_month: shiftDateToMonth(income.period_month, periodMonth),
  }))
}
