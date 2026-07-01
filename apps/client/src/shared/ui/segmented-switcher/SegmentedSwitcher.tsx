import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

const switcherContainerClassName =
  'inline-flex w-auto max-w-full gap-0.5 rounded-xl bg-zinc-100/90 p-0.5 shadow-sm'
const switcherButtonClassName =
  'h-8 min-h-8 rounded-lg border-0 px-3 text-xs font-medium whitespace-nowrap shadow-none sm:text-sm'
const switcherButtonActiveClassName =
  'bg-white font-semibold text-zinc-900 shadow-none hover:bg-white'
const switcherButtonInactiveClassName =
  'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900'

export type SegmentedSwitcherItem<T extends string> = {
  id: T
  label: ReactNode
}

export type SegmentedSwitcherProps<T extends string> = {
  items: readonly SegmentedSwitcherItem<T>[]
  activeId: T
  onSelect: (id: T) => void
  ariaLabel: string
  className?: string
}

/** Сегментированный переключатель разделов (pill-табы). */
export function SegmentedSwitcher<T extends string>({
  items,
  activeId,
  onSelect,
  ariaLabel,
  className,
}: SegmentedSwitcherProps<T>) {
  return (
    <div
      className={cn(switcherContainerClassName, className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = item.id === activeId

        return (
          <Button
            key={item.id}
            type="button"
            role="tab"
            variant="ghost"
            size="sm"
            aria-selected={isActive}
            className={cn(
              switcherButtonClassName,
              isActive
                ? switcherButtonActiveClassName
                : switcherButtonInactiveClassName,
            )}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </Button>
        )
      })}
    </div>
  )
}
