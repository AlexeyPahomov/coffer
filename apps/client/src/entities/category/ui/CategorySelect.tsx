import type { Category } from '../model/types'
import { CategoryNameWithIcon } from './CategoryNameWithIcon'
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/SelectPrimitives'

export type CategorySelectProps = {
  id: string
  value: string
  onValueChange: (value: string) => void
  categories: readonly Category[]
  placeholder?: string
  disabled?: boolean
  /** Разрешить сброс выбора (value → ''). */
  optional?: boolean
  optionalLabel?: string
}

const EMPTY_CATEGORY_VALUE = '__category_none__'

export function CategorySelect({
  id,
  value,
  onValueChange,
  categories,
  placeholder,
  disabled,
  optional = false,
  optionalLabel = 'Не выбрано',
}: CategorySelectProps) {
  const selectedCategory = categories.find((category) => category.id === value)
  const selectValue = value || (optional ? EMPTY_CATEGORY_VALUE : value)

  return (
    <SelectRoot
      value={selectValue}
      onValueChange={(next) =>
        onValueChange(next === EMPTY_CATEGORY_VALUE ? '' : next)
      }
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size="default"
        className="h-9 w-full min-w-0 pr-2"
      >
        {selectedCategory ? (
          <CategoryNameWithIcon category={selectedCategory} />
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent position="popper" className="min-w-(--radix-select-trigger-width)">
        {optional ? (
          <SelectItem
            value={EMPTY_CATEGORY_VALUE}
            className="min-h-9 py-1.5 text-zinc-500"
          >
            {optionalLabel}
          </SelectItem>
        ) : null}
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id} className="min-h-9 py-1.5">
            <CategoryNameWithIcon category={category} />
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}
