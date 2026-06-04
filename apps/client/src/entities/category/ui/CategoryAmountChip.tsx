import type { Category } from '../model/types'
import { CategoryListIcon } from './CategoryListIcon'

import { cn } from '@/shared/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui'

type CategoryAmountChipProps = {
  category: Pick<Category, 'name' | 'type' | 'icon' | 'icon_color'>
  value: string
  className?: string
  focusable?: boolean
}

export function CategoryAmountChip({
  category,
  value,
  className,
  focusable = false,
}: CategoryAmountChipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex min-w-0 cursor-default select-none items-center gap-2 rounded-xl bg-white/80 px-2.5 py-2 text-sm shadow-sm',
            className,
          )}
          tabIndex={focusable ? 0 : undefined}
          aria-label={`${category.name}: ${value}`}
        >
          <CategoryListIcon category={category} iconClassName="size-4" />
          <span className="shrink-0 cursor-default font-semibold tabular-nums text-zinc-900">
            {value}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{category.name}</TooltipContent>
    </Tooltip>
  )
}
