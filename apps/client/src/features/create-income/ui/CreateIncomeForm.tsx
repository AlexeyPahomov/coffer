import type { Income } from '@/entities/income/model/types'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent } from '@/shared/ui'

import { useIncomeForm } from '../model/useIncomeForm'

import { IncomeFormFields } from './IncomeFormFields'

export type CreateIncomeFormVariant = 'card' | 'plain'

export type CreateIncomeFormProps = {
  editingIncome?: Income | null
  onCancel?: () => void
  onComplete?: () => void
  onReceived?: (income: Income) => void
  variant?: CreateIncomeFormVariant
  /** Полноширинные кнопки в колонку — для bottom sheet на мобилках. */
  stackActions?: boolean
  className?: string
}

export function CreateIncomeForm({
  editingIncome = null,
  onCancel,
  onComplete,
  onReceived,
  variant = 'card',
  stackActions = false,
  className,
}: CreateIncomeFormProps) {
  const form = useIncomeForm({ editingIncome, onComplete, onReceived })

  const fields = (
    <IncomeFormFields
      form={form}
      stackActions={stackActions}
      onCancel={onCancel}
    />
  )

  if (variant === 'plain') {
    return <div className={cn('w-full', className)}>{fields}</div>
  }

  return (
    <Card className={cn('h-fit w-full max-h-full', className)}>
      <CardContent className="pt-6">{fields}</CardContent>
    </Card>
  )
}
