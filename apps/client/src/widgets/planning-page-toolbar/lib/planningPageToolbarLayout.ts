import { cn } from '@/shared/lib/utils'
import { fabDesktopAddButtonClassName } from '@/shared/ui/fab'

export const planningPageToolbarClassName =
  'flex w-full min-w-0 shrink-0 flex-col gap-4 overflow-x-hidden'

export const planningPageToolbarRowClassName =
  'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'

export const planningPageAddButtonDesktopClassName = cn(
  fabDesktopAddButtonClassName,
  'w-full md:w-auto',
)
