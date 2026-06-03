import { parseMoneyInput } from '@coffer/shared'

import type { FinishPlannedExpensePayload } from '@/entities/planned-expense/model/types'

import type { FinishPlannedExpenseFormValues } from '../lib/finishPlannedExpenseFormValues'

export function parseFinishPlannedExpenseForm(
  values: FinishPlannedExpenseFormValues,
): { error: string } | { payload: FinishPlannedExpensePayload } {
  if (!values.category_id) {
    return { error: 'Выберите категорию' }
  }

  const amount = parseMoneyInput(values.amount)
  if (amount === null) {
    return { error: 'Укажите сумму больше нуля' }
  }

  if (!values.date) {
    return { error: 'Выберите дату' }
  }

  const description = values.description.trim()

  return {
    payload: {
      category_id: values.category_id,
      amount,
      date: values.date,
      ...(description ? { description } : {}),
    },
  }
}
