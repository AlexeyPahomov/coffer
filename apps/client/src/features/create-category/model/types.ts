import type { CategoryPayload } from '@/entities/category/model/types'
import type {
  CarryOverPolicy,
  CategoryIconKey,
  CategoryType,
  IconColorKey,
} from '@coffer/shared'

export type CategoryFormValues = {
  name: string
  type: string
  icon: CategoryIconKey
  icon_color: IconColorKey
  carry_over_policy: CarryOverPolicy
}

export type ValidCategoryFormPayload = CategoryPayload & {
  type: CategoryType
}
