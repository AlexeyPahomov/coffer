import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Category } from '@/entities/category/model/types'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { ResponsiveFormDialog } from '@/shared/ui/responsive-form-dialog'

import { AllocationRuleForm } from './AllocationRuleForm'

type AllocationRuleFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  onClose: () => void
  editingRule?: AllocationRule | null
  categories: readonly Category[]
}

export function AllocationRuleFormDialog({
  open,
  onOpenChange,
  isEditing,
  onClose,
  editingRule = null,
  categories,
}: AllocationRuleFormDialogProps) {
  const isMobile = useIsMobile()

  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Изменить правило' : 'Новое правило распределения'}
      description="Задайте шаблон, который позже можно применить к доходу."
      bodyClassName={isMobile ? 'pt-3' : 'pt-2'}
    >
      <AllocationRuleForm
        key={editingRule?.id ?? 'new'}
        categories={categories}
        editingRule={editingRule}
        stackActions={isMobile}
        onCancel={onClose}
        onComplete={onClose}
      />
    </ResponsiveFormDialog>
  )
}
