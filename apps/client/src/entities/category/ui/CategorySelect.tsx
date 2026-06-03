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
}

export function CategorySelect({
  id,
  value,
  onValueChange,
  categories,
  placeholder,
  disabled,
}: CategorySelectProps) {
  const selectedCategory = categories.find((category) => category.id === value)

  return (
    <SelectRoot value={value} onValueChange={onValueChange} disabled={disabled}>
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
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id} className="min-h-9 py-1.5">
            <CategoryNameWithIcon category={category} />
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}
