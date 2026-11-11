import {
  DEFAULT_ICON_COLOR_KEY,
  DEFAULT_PLANNED_EXPENSE_ICON_KEY,
  parseMoneyInput,
} from '@coffer/shared'

import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import type {
  CreatePlannedExpensePayload,
  UpdatePlannedExpensePayload,
} from '@/entities/planned-expense/model/types'
import {
  isoToDateInputValue,
  normalizeDateRangeEnd,
} from '@/shared/lib/date'
import { moneyAmountToFormValue } from '@/shared/lib/moneyInput'

import type { CreatePlannedExpenseFormValues } from '../model/types'

export function emptyPlannedExpenseFormValues(): CreatePlannedExpenseFormValues {
  return {
    title: '',
    description: '',
    icon_name: DEFAULT_PLANNED_EXPENSE_ICON_KEY,
    icon_color: DEFAULT_ICON_COLOR_KEY,
    amount: '',
    planned_date: '',
    planned_date_end: '',
    category_id: '',
    savings_category_id: '',
    savings_amount: '',
  }
}

export function plannedExpenseToFormValues(
  item: PlannedExpense,
): CreatePlannedExpenseFormValues {
  return {
    title: item.title,
    description: item.description ?? '',
    icon_name: item.icon_name,
    icon_color: item.icon_color,
    amount: moneyAmountToFormValue(item.amount),
    planned_date: isoToDateInputValue(item.planned_date),
    planned_date_end: item.planned_date_end
      ? isoToDateInputValue(item.planned_date_end)
      : '',
    category_id: item.category_id ?? '',
    savings_category_id: item.savings_category_id ?? '',
    savings_amount:
      item.savings_amount > 0 ? moneyAmountToFormValue(item.savings_amount) : '',
  }
}

export function resolvePlannedExpenseFormValues(
  editingItem: PlannedExpense | null | undefined,
): CreatePlannedExpenseFormValues {
  if (editingItem) {
    return plannedExpenseToFormValues(editingItem)
  }
  return emptyPlannedExpenseFormValues()
}

export function buildPlannedExpenseDatePayload(
  start: string,
  end: string,
): Pick<CreatePlannedExpensePayload, 'planned_date' | 'planned_date_end'> {
  const planned_date_end = normalizeDateRangeEnd(start, end)
  return planned_date_end != null
    ? { planned_date: start, planned_date_end }
    : { planned_date: start }
}

export function buildPlannedExpenseDateUpdatePatch(
  start: string,
  end: string,
  previous: Pick<CreatePlannedExpenseFormValues, 'planned_date' | 'planned_date_end'>,
): Pick<UpdatePlannedExpensePayload, 'planned_date' | 'planned_date_end'> {
  const patch: Pick<
    UpdatePlannedExpensePayload,
    'planned_date' | 'planned_date_end'
  > = {}
  const nextEnd = normalizeDateRangeEnd(start, end)
  const prevEnd = normalizeDateRangeEnd(
    previous.planned_date,
    previous.planned_date_end,
  )

  if (start !== previous.planned_date) {
    patch.planned_date = start
  }
  if (nextEnd !== prevEnd) {
    patch.planned_date_end = nextEnd ?? null
  }

  return patch
}

/** Доля из накоплений: без конверта — 0; с конвертом — 0 < доля ≤ суммы плана, иначе null. */
export function parsePlannedExpenseSavingsAmount(
  values: Pick<
    CreatePlannedExpenseFormValues,
    'savings_category_id' | 'savings_amount'
  >,
  amount: number | null,
): number | null {
  if (!values.savings_category_id) {
    return 0
  }
  const savingsAmount = parseMoneyInput(values.savings_amount)
  if (savingsAmount === null || savingsAmount <= 0) {
    return null
  }
  if (amount !== null && savingsAmount > amount) {
    return null
  }
  return savingsAmount
}

/** Почему доля из накоплений не принимается (кнопка сохранения из-за неё отключена). */
export function resolvePlannedExpenseSavingsAmountError(
  values: Pick<
    CreatePlannedExpenseFormValues,
    'amount' | 'savings_category_id' | 'savings_amount'
  >,
): string | null {
  const amount = parseMoneyInput(values.amount)
  if (parsePlannedExpenseSavingsAmount(values, amount) !== null) {
    return null
  }
  const savingsAmount = parseMoneyInput(values.savings_amount)
  if (savingsAmount === null || savingsAmount <= 0) {
    return 'Укажите, сколько взять из накоплений, или выберите «Не добавлять».'
  }
  return 'Из накоплений нельзя взять больше суммы плана.'
}
