import type { Category } from '@/entities/category/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'

import {
  finishPlannedExpenseDialogDescription,
  finishPlannedExpenseDialogTitle,
  formatFinishPlannedExpenseSavingsNote,
} from '../lib/finishPlannedExpenseDialogCopy'
import { useFinishPlannedExpenseForm } from '../model/useFinishPlannedExpenseForm'

import { FinishPlannedExpenseFields } from './FinishPlannedExpenseFields'

export type FinishPlannedExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PlannedExpense | null
  categories: Category[]
}

export function FinishPlannedExpenseDialog({
  open,
  onOpenChange,
  item,
  categories,
}: FinishPlannedExpenseDialogProps) {
  const form = useFinishPlannedExpenseForm({
    item,
    onSuccess: () => onOpenChange(false),
  })
  const savingsNote = item ? formatFinishPlannedExpenseSavingsNote(item) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{finishPlannedExpenseDialogTitle}</DialogTitle>
          <DialogDescription>
            {finishPlannedExpenseDialogDescription}
            {savingsNote ? ` ${savingsNote}` : null}
          </DialogDescription>
        </DialogHeader>
        {item ? (
          <FinishPlannedExpenseFields
            key={item.id}
            item={item}
            categories={categories}
            form={form}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
