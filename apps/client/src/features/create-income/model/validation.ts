import { isIncomeStatus, isIncomeType, parseMoneyInput } from '@coffer/shared'

import { parseDateInputValue } from '@/shared/lib/date'

import type { IncomeFormPayload, IncomeFormValues } from './types'

export function validateIncomeForm(
  values: IncomeFormValues,
):
  | { ok: true; payload: IncomeFormPayload }
  | { ok: false; error: string } {
  const parsed = parseMoneyInput(values.amount)
  if (parsed === null) {
    return { ok: false as const, error: 'Укажите сумму больше нуля' }
  }

  const period_month = values.period_month.trim()
  if (!parseDateInputValue(period_month)) {
    return { ok: false as const, error: 'Выберите дату' }
  }

  if (!isIncomeType(values.income_type)) {
    return { ok: false as const, error: 'Выберите тип дохода' }
  }

  if (!isIncomeStatus(values.status)) {
    return { ok: false as const, error: 'Выберите статус дохода' }
  }

  return {
    ok: true as const,
    payload: {
      amount: parsed,
      source: values.source.trim() || undefined,
      income_type: values.income_type,
      status: values.status,
      period_month,
    },
  }
}
