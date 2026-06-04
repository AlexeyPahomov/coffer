import {
  DEFAULT_ALLOCATION_RULE_LINE_MODE,
  INCOME_TYPES,
  isAllocationRuleLineMode,
  parseMoneyInput,
  type IncomeType,
} from '@coffer/shared'

import type {
  AllocationRule,
  AllocationRulePayload,
} from '@/entities/allocation-rule/model/types'
import type { Category } from '@/entities/category/model/types'

export type AllocationRuleLineFormValues = {
  id: string
  category_id: string
  mode: string
  amount: string
  percent: string
}

export type AllocationRuleFormValues = {
  name: string
  trigger_income_type: string
  is_active: boolean
  lines: AllocationRuleLineFormValues[]
}

const ANY_INCOME_TYPE_VALUE = 'any'

export function createAllocationRuleLineFormValues(
  categoryId = '',
): AllocationRuleLineFormValues {
  return {
    id: crypto.randomUUID(),
    category_id: categoryId,
    mode: DEFAULT_ALLOCATION_RULE_LINE_MODE,
    amount: '',
    percent: '',
  }
}

export function emptyAllocationRuleFormValues(
  categories: readonly Category[],
): AllocationRuleFormValues {
  return {
    name: '',
    trigger_income_type: ANY_INCOME_TYPE_VALUE,
    is_active: true,
    lines: [createAllocationRuleLineFormValues(categories[0]?.id ?? '')],
  }
}

export function resolveAllocationRuleFormValues(
  rule: AllocationRule | null | undefined,
  categories: readonly Category[],
): AllocationRuleFormValues {
  if (!rule) {
    return emptyAllocationRuleFormValues(categories)
  }

  return {
    name: rule.name,
    trigger_income_type: rule.trigger_income_type ?? ANY_INCOME_TYPE_VALUE,
    is_active: rule.is_active,
    lines: rule.lines.map((line) => ({
      id: line.id,
      category_id: line.category_id,
      mode: line.mode,
      amount: line.amount ?? '',
      percent: line.percent ?? '',
    })),
  }
}

function parsePercentInput(raw: string): number | null {
  const value = Number(raw.trim().replace(',', '.'))
  return Number.isFinite(value) && value > 0 && value <= 100 ? value : null
}

export function validateAllocationRuleForm(
  values: AllocationRuleFormValues,
):
  | { ok: true; payload: AllocationRulePayload }
  | { ok: false; error: string } {
  const name = values.name.trim()
  if (!name) {
    return { ok: false, error: 'Введите название правила' }
  }

  if (values.lines.length === 0) {
    return { ok: false, error: 'Добавьте хотя бы одну строку распределения' }
  }

  const lines = values.lines.map((line, index) => {
    if (!line.category_id) {
      throw new Error('Выберите категорию для каждой строки')
    }
    if (!isAllocationRuleLineMode(line.mode)) {
      throw new Error('Выберите тип строки распределения')
    }

    if (line.mode === 'FIXED') {
      const amount = parseMoneyInput(line.amount)
      if (amount === null) {
        throw new Error('Укажите сумму больше нуля')
      }
      return {
        category_id: line.category_id,
        mode: line.mode,
        amount,
        percent: null,
        position: index,
      }
    }

    const percent = parsePercentInput(line.percent)
    if (percent === null) {
      throw new Error('Укажите процент от 0 до 100')
    }
    return {
      category_id: line.category_id,
      mode: line.mode,
      amount: null,
      percent,
      position: index,
    }
  })

  const trigger_income_type =
    values.trigger_income_type === ANY_INCOME_TYPE_VALUE
      ? null
      : (values.trigger_income_type as IncomeType)

  if (
    trigger_income_type !== null &&
    !INCOME_TYPES.includes(trigger_income_type)
  ) {
    return { ok: false, error: 'Выберите тип дохода' }
  }

  return {
    ok: true,
    payload: {
      name,
      trigger_income_type,
      is_active: values.is_active,
      lines,
    },
  }
}

export function anyIncomeTypeValue() {
  return ANY_INCOME_TYPE_VALUE
}
