import {
  isCarryOverPolicy,
  isCategoryIconKey,
  isCategoryType,
  isIconColorKey,
} from '@coffer/shared'

import type { CategoryFormValues, ValidCategoryFormPayload } from './types'

export function validateCategoryForm(
  values: CategoryFormValues,
):
  | { ok: true; payload: ValidCategoryFormPayload }
  | { ok: false; error: string } {
  const name = values.name.trim()
  if (!name) {
    return { ok: false as const, error: 'Введите название категории' }
  }

  if (!isCategoryType(values.type)) {
    return { ok: false as const, error: 'Выберите тип категории' }
  }

  if (!isCategoryIconKey(values.icon)) {
    return { ok: false as const, error: 'Выберите иконку категории' }
  }

  if (!isIconColorKey(values.icon_color)) {
    return { ok: false as const, error: 'Выберите цвет категории' }
  }

  const payload: ValidCategoryFormPayload = {
    name,
    type: values.type,
    icon: values.icon,
    icon_color: values.icon_color,
  }

  if (values.type === 'expense') {
    if (!isCarryOverPolicy(values.carry_over_policy)) {
      return { ok: false as const, error: 'Выберите политику переноса остатка' }
    }
    payload.carry_over_policy = values.carry_over_policy
  }

  return {
    ok: true as const,
    payload,
  }
}
