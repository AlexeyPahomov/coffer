import type { Income } from '@/entities/income/model/types'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { ResponsiveFormDialog } from '@/shared/ui/responsive-form-dialog'

import {
  incomeFormDialogDescription,
  incomeFormDialogTitle,
} from '../lib/incomeFormDialogCopy'
import { incomeFormDialogBodyClassName } from '../lib/incomeFormLayout'

import { CreateIncomeForm } from './CreateIncomeForm'

export type CreateIncomeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  onClose: () => void
  editingIncome?: Income | null
  onReceived?: (income: Income) => void
}

export function CreateIncomeFormDialog({
  open,
  onOpenChange,
  isEditing,
  onClose,
  editingIncome = null,
  onReceived,
}: CreateIncomeFormDialogProps) {
  const isMobile = useIsMobile()
  const formKey = editingIncome?.id ?? 'new'

  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={incomeFormDialogTitle(isEditing)}
      description={incomeFormDialogDescription(isEditing)}
      bodyClassName={incomeFormDialogBodyClassName}
      hideHeader
    >
      <CreateIncomeForm
        key={formKey}
        variant="plain"
        stackActions={isMobile}
        editingIncome={editingIncome}
        onCancel={onClose}
        onComplete={onClose}
        onReceived={onReceived}
      />
    </ResponsiveFormDialog>
  )
}
