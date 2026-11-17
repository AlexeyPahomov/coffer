import {
  PLANNED_EXPENSE_ICON_KEYS,
  PLANNED_EXPENSE_ICON_LABELS,
  type PlannedExpenseIconKey,
  type IconColorKey,
  resolveIconColorKey,
} from '@coffer/shared'
import { createElement } from 'react'

import {
  getPlannedExpenseLucideIcon,
  resolvePlannedExpenseIconKey,
} from '../lib/plannedExpenseIcons'
import { buildIconColorPickerOptions } from '@/shared/lib/iconColorPicker'
import { IconPicker } from '@/shared/ui'

type PlannedExpenseIconPickerProps = {
  iconName: string
  iconColor: string
  onIconChange: (iconName: PlannedExpenseIconKey) => void
  onColorChange: (iconColor: IconColorKey) => void
  disabled?: boolean
}

export function PlannedExpenseIconPicker({
  iconName,
  iconColor,
  onIconChange,
  onColorChange,
  disabled = false,
}: PlannedExpenseIconPickerProps) {
  return (
    <IconPicker
      iconValue={resolvePlannedExpenseIconKey(iconName)}
      colorValue={resolveIconColorKey(iconColor)}
      disabled={disabled}
      icons={PLANNED_EXPENSE_ICON_KEYS.map((value) => ({
        value,
        label: PLANNED_EXPENSE_ICON_LABELS[value],
      }))}
      colors={buildIconColorPickerOptions()}
      onIconChange={onIconChange}
      onColorChange={onColorChange}
      renderIcon={(icon, className) =>
        createElement(getPlannedExpenseLucideIcon(icon), { className })
      }
    />
  )
}
