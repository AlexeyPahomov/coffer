import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import type { Category } from '@/entities/category/model/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'

import {
  editPlannedExpenseDialogDescription,
  editPlannedExpenseDialogTitle,
} from '../lib/plannedExpenseFormDialogCopy'
import { useCreatePlannedExpenseForm } from '../model/useCreatePlannedExpenseForm'

import { CreatePlannedExpenseFields } from './CreatePlannedExpenseFields'

export type EditPlannedExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PlannedExpense | null
  categories: readonly Category[]
}

export function EditPlannedExpenseDialog({
  open,
  onOpenChange,
  item,
  categories,
}: EditPlannedExpenseDialogProps) {
  const form = useCreatePlannedExpenseForm({
    editingPlannedExpense: item,
    onSuccess: () => onOpenChange(false),
  })

  const formKey = item?.id ?? 'closed'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editPlannedExpenseDialogTitle()}</DialogTitle>
          <DialogDescription className="sr-only">
            {editPlannedExpenseDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        <div key={formKey} className="flex flex-col gap-3">
          <CreatePlannedExpenseFields
            values={form.values}
            categories={categories}
            onChange={form.handleChange}
            patchValues={form.patchValues}
            onSubmit={form.submit}
            isPending={form.isPending}
            isSubmitDisabled={form.isSubmitDisabled}
            submitLabel="Сохранить"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
