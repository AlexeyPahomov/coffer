export const INCOME_TYPES = [
  'salary',
  'freelance',
  'interest',
  'cashback',
  'refund',
  'investment',
  'other',
] as const

export type IncomeType = (typeof INCOME_TYPES)[number]

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  salary: 'Зарплата',
  freelance: 'Фриланс',
  interest: 'Проценты',
  cashback: 'Кэшбэк',
  refund: 'Возврат',
  investment: 'Инвестиции',
  other: 'Другое',
}

export const DEFAULT_INCOME_TYPE: IncomeType = 'salary'

export function isIncomeType(value: string): value is IncomeType {
  return (INCOME_TYPES as readonly string[]).includes(value)
}

export function resolveIncomeType(
  value: string | null | undefined,
): IncomeType {
  if (value && isIncomeType(value)) {
    return value
  }
  return DEFAULT_INCOME_TYPE
}

/** Доходы, которые могут открыть новый цикл расходования. */
export function canAnchorIncomeCycle(
  incomeType: string | null | undefined,
): boolean {
  const type = resolveIncomeType(incomeType)
  return type === 'salary' || type === 'freelance'
}
