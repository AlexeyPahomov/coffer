import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Card, CardContent } from '../card/Card'

type ListEmptyProps = {
  message?: string
  /** Действие под сообщением (например, кнопка быстрого заполнения). */
  action?: ReactNode
  className?: string
}

export function ListEmpty({
  message = 'Пока нет записей.',
  action,
  className,
}: ListEmptyProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <Card className="flex min-h-0 flex-1 flex-col border-dashed border-muted-foreground/30">
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          {action}
        </CardContent>
      </Card>
    </div>
  )
}
