import { Plus, type LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

import { Button, primaryActionButtonClassName } from '../button'

import { fabButtonClassName, fabWrapClassName } from './fabLayout'
import { PortalFabToBody } from './portalFabToBody'

export type FabProps = Omit<ComponentProps<typeof Button>, 'children' | 'size'> & {
  /** Подпись для `aria-label` и `title`. */
  label: string
  /** Иконка вместо «+» — для действий, которые ничего не добавляют. */
  icon?: LucideIcon
}

export function Fab({
  label,
  icon: Icon = Plus,
  className,
  type = 'button',
  ...props
}: FabProps) {
  return (
    <PortalFabToBody>
      <div className={fabWrapClassName}>
        <Button
          type={type}
          size="icon-lg"
          className={cn(
            primaryActionButtonClassName,
            fabButtonClassName,
            'pointer-events-auto',
            className,
          )}
          aria-label={label}
          title={label}
          {...props}
        >
          <Icon className="size-5" aria-hidden />
        </Button>
      </div>
    </PortalFabToBody>
  )
}
