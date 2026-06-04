import type { PlannedExpenseIconKey } from '@coffer/shared'
import {
  DEFAULT_PLANNED_EXPENSE_ICON_KEY,
  isPlannedExpenseIconKey,
} from '@coffer/shared'
import {
  Building2,
  Car,
  Dog,
  Gift,
  HeartPulse,
  Home,
  Kayak,
  Landmark,
  Plane,
  Shield,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Trees,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export const PLANNED_EXPENSE_ICON_COMPONENTS: Record<
  PlannedExpenseIconKey,
  LucideIcon
> = {
  gift: Gift,
  plane: Plane,
  kayak: Kayak,
  trees: Trees,
  car: Car,
  home: Home,
  landmark: Landmark,
  health: HeartPulse,
  wallet: Wallet,
  utensils: Utensils,
  'shopping-cart': ShoppingCart,
  'building-2': Building2,
  dog: Dog,
  smartphone: Smartphone,
  shield: Shield,
  sparkles: Sparkles,
}

export function getPlannedExpenseLucideIcon(
  iconKey: PlannedExpenseIconKey,
): LucideIcon {
  return PLANNED_EXPENSE_ICON_COMPONENTS[iconKey]
}

export function resolvePlannedExpenseIconKey(
  icon: string | null | undefined,
): PlannedExpenseIconKey {
  if (icon && isPlannedExpenseIconKey(icon)) {
    return icon
  }

  return DEFAULT_PLANNED_EXPENSE_ICON_KEY
}
