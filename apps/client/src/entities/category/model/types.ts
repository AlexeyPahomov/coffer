import type {
  CarryOverPolicy,
  CategoryIconKey,
  CategoryType,
  IconColorKey,
} from '@coffer/shared'

export type { CategoryType, CategoryIconKey, IconColorKey, CarryOverPolicy }

export type Category = {
  id: string
  user_id: string
  name: string
  type: CategoryType
  icon: CategoryIconKey
  icon_color: IconColorKey
  carry_over_policy: CarryOverPolicy
  created_at: string
}

export type CategoryPayload = {
  name: string
  type: CategoryType
  icon: CategoryIconKey
  icon_color: IconColorKey
  carry_over_policy?: CarryOverPolicy
}

/** @deprecated Используйте CategoryPayload */
export type CreateCategoryPayload = CategoryPayload

/** @deprecated Используйте CategoryPayload */
export type UpdateCategoryPayload = CategoryPayload
