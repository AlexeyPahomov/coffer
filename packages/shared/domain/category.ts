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

export function isCategoryType(value: string): value is CategoryType {
  return (CATEGORY_TYPES as readonly string[]).includes(value)
}
