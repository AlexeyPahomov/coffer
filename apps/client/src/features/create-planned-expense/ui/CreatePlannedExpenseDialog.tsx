import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import type { Category } from '@/entities/category/model/types'

import { plannedExpenseFormDialogDescription } from '../lib/plannedExpenseFormDialogCopy'
import { useCreatePlannedExpenseForm } from '../model/useCreatePlannedExpenseForm'

import { CreatePlannedExpenseFields } from './CreatePlannedExpenseFields'

export type CreatePlannedExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorPeriodMonth: string
  categories: readonly Category[]
}

export function CreatePlannedExpenseDialog({
  open,
  onOpenChange,
  anchorPeriodMonth: _anchorPeriodMonth,
  categories,
}: CreatePlannedExpenseDialogProps) {
  const form = useCreatePlannedExpenseForm({
    onSuccess: () => onOpenChange(false),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый план</DialogTitle>
          <DialogDescription className="sr-only">
            {plannedExpenseFormDialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <CreatePlannedExpenseFields
            values={form.values}
            categories={categories}
            onChange={form.handleChange}
            patchValues={form.patchValues}
            onSubmit={form.submit}
            isPending={form.isPending}
            isSubmitDisabled={form.isSubmitDisabled}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
