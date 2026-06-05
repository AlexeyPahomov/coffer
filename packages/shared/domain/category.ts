export const CATEGORY_TYPES = ['income', 'expense', 'savings'] as const

export type CategoryType = (typeof CATEGORY_TYPES)[number]

export const CARRY_OVER_POLICIES = [
  'RESET',
  'CARRY',
  'TRANSFER_TO_FREE',
] as const

export type CarryOverPolicy = (typeof CARRY_OVER_POLICIES)[number]

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: 'Доход',
  expense: 'Расход',
  savings: 'Накопления',
}

/** Подписи политики переноса остатка конверта. */
export const CARRY_OVER_POLICY_LABELS: Record<CarryOverPolicy, string> = {
  RESET: 'Не переносить',
  CARRY: 'Переносить в конверт',
  TRANSFER_TO_FREE: 'В свободные средства',
}

/** Краткие пояснения для UI настроек категории. */
export const CARRY_OVER_POLICY_HINTS: Record<CarryOverPolicy, string> = {
  RESET: 'Непотраченный остаток не переносится на следующий доходный цикл.',
  CARRY:
    'Остаток конверта сохраняется при поступлении расчёта и в новом цикле.',
  TRANSFER_TO_FREE:
    'Непотраченное в конце цикла вернётся в свободный пул (скоро).',
}

export function isCategoryType(value: string): value is CategoryType {
  return (CATEGORY_TYPES as readonly string[]).includes(value)
}

export function isCarryOverPolicy(value: string): value is CarryOverPolicy {
  return (CARRY_OVER_POLICIES as readonly string[]).includes(value)
}

export const CARRY_OVER_CHECKBOX_LABEL = 'Переносить остаток в конверт'

/** Политика по умолчанию: расходные конверты переносят остаток. */
export function defaultCarryOverPolicy(type: CategoryType): CarryOverPolicy {
  return type === 'expense' ? 'CARRY' : 'RESET'
}

export function resolveCarryOverPolicy(
  type: CategoryType,
  policy: CarryOverPolicy | null | undefined,
): CarryOverPolicy {
  return policy ?? defaultCarryOverPolicy(type)
}

export function isCarryOverEnabled(policy: CarryOverPolicy): boolean {
  return policy === 'CARRY'
}

export function carryOverPolicyFromCheckbox(checked: boolean): CarryOverPolicy {
  return checked ? 'CARRY' : 'RESET'
}

/** Подсказка для чекбокса (RESET / CARRY; TRANSFER_TO_FREE трактуется как RESET). */
export function carryOverPolicyHintForCheckbox(
  policy: CarryOverPolicy,
): string {
  return CARRY_OVER_POLICY_HINTS[policy === 'CARRY' ? 'CARRY' : 'RESET']
}
