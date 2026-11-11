import {
  DEFAULT_INCOME_TYPE,
  resolveIncomeStatus,
  resolveIncomeType,
} from '@coffer/shared'

import type { Income } from '@/entities/income/model/types'
import {
  currentMonthInputValue,
  isoToDateInputValue,
  todayDateInputValue,
} from '@/shared/lib/date'
import { moneyAmountToFormValue } from '@/shared/lib/moneyInput'

import type { IncomeFormValues } from '../model/types'

/** `periodMonth` (`YYYY-MM`) — месяц, открытый на странице: для чужого месяца берём его 1-е число. */
export function emptyIncomeFormValues(periodMonth?: string): IncomeFormValues {
  return {
    amount: '',
    source: '',
    income_type: DEFAULT_INCOME_TYPE,
    // Новый доход по умолчанию — план (EXPECTED); получение идёт через
    // кнопку «Получить» / статус в форме, чтобы предложить правила.
    status: 'EXPECTED',
    period_month:
      periodMonth && periodMonth !== currentMonthInputValue()
        ? `${periodMonth}-01`
        : todayDateInputValue(),
  }
}

export function resolveIncomeFormValues(
  income: Income | null | undefined,
  defaultPeriodMonth?: string,
): IncomeFormValues {
  if (!income) {
    return emptyIncomeFormValues(defaultPeriodMonth)
  }

  return {
    amount: moneyAmountToFormValue(income.amount),
    source: income.source ?? '',
    income_type: resolveIncomeType(income.income_type),
    status: resolveIncomeStatus(income.status),
    period_month: isoToDateInputValue(income.period_month),
  }
}
