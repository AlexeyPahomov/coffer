import { useCallback, useMemo, useState } from 'react'

import { useDeleteAllocationRuleMutation } from '@/entities/allocation-rule/api/useDeleteAllocationRuleMutation'
import { useAllocationRulesQuery } from '@/entities/allocation-rule/api/useAllocationRulesQuery'
import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import { useCategoriesQuery } from '@/entities/category/api/useCategoriesQuery'
import { isBudgetEnvelopeCategory } from '@/entities/category/lib/categoryKind'
import { useFormDialog } from '@/shared/lib/hooks/useFormDialog'

export function useAllocationRulesPage() {
  const [editingRule, setEditingRule] = useState<AllocationRule | null>(null)
  const rulesQuery = useAllocationRulesQuery()
  const deleteRuleMutation = useDeleteAllocationRuleMutation()
  const { mutate: deleteRule } = deleteRuleMutation
  const categoriesQuery = useCategoriesQuery()
  const dialog = useFormDialog(editingRule != null, {
    clearEditingOnOpenAdd: true,
    onClearEditing: () => setEditingRule(null),
  })

  const categories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter((category) =>
        isBudgetEnvelopeCategory(category.type),
      ),
    [categoriesQuery.data],
  )
  const handleDeleteRule = useCallback(
    (ruleId: string) => deleteRule(ruleId),
    [deleteRule],
  )

  return {
    rulesQuery,
    deleteRuleMutation,
    categoriesQuery,
    categories,
    onEditRule: setEditingRule,
    onDeleteRule: handleDeleteRule,
    fab: {
      label: 'Добавить правило',
      onClick: dialog.openForAdd,
    },
    formDialog: {
      open: dialog.isOpen,
      onOpenChange: dialog.onOpenChange,
      isEditing: dialog.isEditing,
      onClose: dialog.close,
      editingRule,
      categories,
    },
  }
}
