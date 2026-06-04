import type { CategoryIconKey, CategoryType } from '@coffer/shared'
import {
  DEFAULT_CATEGORY_ICON_KEY,
  isCategoryIconKey,
} from '@coffer/shared'
import {
  Baby,
  BookOpen,
  Building2,
  Car,
  Dog,
  Dumbbell,
  Gift,
  HeartPulse,
  Home,
  Landmark,
  Plane,
  ShoppingCart,
  Shirt,
  Trees,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export const CATEGORY_ICON_COMPONENTS: Record<CategoryIconKey, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  wallet: Wallet,
  home: Home,
  'building-2': Building2,
  utensils: Utensils,
  landmark: Landmark,
  car: Car,
  trees: Trees,
  dog: Dog,
  health: HeartPulse,
  shirt: Shirt,
  dumbbell: Dumbbell,
  gift: Gift,
  plane: Plane,
  'book-open': BookOpen,
  baby: Baby,
}

const LEGACY_ICON_KEY_BY_NAME: Partial<Record<string, CategoryIconKey>> = {
  карманные: 'wallet',
  дача: 'home',
  продукты: 'utensils',
  квартира: 'building-2',
}

export function getLucideIconByKey(iconKey: CategoryIconKey): LucideIcon {
  return CATEGORY_ICON_COMPONENTS[iconKey]
}

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase()
}

export function resolveCategoryIconKey(
  icon: string | null | undefined,
  categoryName: string,
  categoryType: CategoryType,
): CategoryIconKey {
  if (icon && isCategoryIconKey(icon)) {
    return icon
  }

  if (categoryType === 'savings') {
    return 'landmark'
  }

  return (
    LEGACY_ICON_KEY_BY_NAME[normalizeCategoryName(categoryName)] ??
    DEFAULT_CATEGORY_ICON_KEY
  )
}

export function resolveCategoryLucideIcon(
  icon: string | null | undefined,
  categoryName: string,
  categoryType: CategoryType,
): LucideIcon {
  return getLucideIconByKey(
    resolveCategoryIconKey(icon, categoryName, categoryType),
  )
}
