import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import { allocationFormDialogBodyClassName } from '@/features/create-allocation/lib/allocationFormDialog'
import type { AllocationFormController } from '@/features/create-allocation/model/types'
import { AllocationQuickForm } from '@/features/create-allocation/ui/AllocationQuickForm'
import { ResponsiveFormDialog } from '@/shared/ui'

type AllocationFormSheetsProps = {
  categories: readonly Category[]
  noCategories: boolean
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  createForm: AllocationFormController
  onCreateSubmit: () => void | Promise<void>
  editingAllocation: Allocation | null
  onEditingAllocationChange: (allocation: Allocation | null) => void
  editForm: AllocationFormController
  onEditSubmit: () => void | Promise<void>
}

export function AllocationFormSheets({
  categories,
  noCategories,
  createOpen,
  onCreateOpenChange,
  createForm,
  onCreateSubmit,
  editingAllocation,
  onEditingAllocationChange,
  editForm,
  onEditSubmit,
}: AllocationFormSheetsProps) {
  const createDisabled = createForm.disabled || createForm.submitting
  const editDisabled = editForm.disabled || editForm.submitting

  return (
    <>
      <ResponsiveFormDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        title="Быстрое распределение"
        description="Выберите категорию и сумму распределения"
        bodyClassName={allocationFormDialogBodyClassName}
        hideHeader
      >
        <AllocationQuickForm
          categories={categories}
          noCategories={noCategories}
          controlsDisabled={createDisabled}
          form={createForm}
          onSubmit={onCreateSubmit}
        />
      </ResponsiveFormDialog>

      <ResponsiveFormDialog
        open={editingAllocation !== null}
        onOpenChange={(open) => {
          if (!open) {
            onEditingAllocationChange(null)
          }
        }}
        title="Редактирование распределения"
        description="Измените категорию или сумму"
        bodyClassName={allocationFormDialogBodyClassName}
        hideHeader
      >
        <AllocationQuickForm
          categories={categories}
          noCategories={noCategories}
          controlsDisabled={editDisabled}
          form={editForm}
          onSubmit={onEditSubmit}
          submitLabel="Сохранить"
        />
      </ResponsiveFormDialog>
    </>
  )
}
