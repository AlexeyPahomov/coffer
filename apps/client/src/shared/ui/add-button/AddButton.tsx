import { PlusCircle } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/utils';

import { Button, primaryActionButtonClassName } from '../button';

export type AddButtonProps = ComponentProps<typeof Button>;

export function AddButton({
  className,
  children,
  type = 'button',
  size = 'lg',
  ...props
}: AddButtonProps) {
  return (
    <Button
      type={type}
      size={size}
      className={cn(primaryActionButtonClassName, className)}
      {...props}
    >
      <span className="inline-flex items-center gap-2">
        <PlusCircle className="size-3" aria-hidden="true" />
        {children}
      </span>
    </Button>
  );
}
