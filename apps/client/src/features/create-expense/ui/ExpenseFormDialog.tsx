import type { Allocation } from '@/entities/allocation/model/types'
import type { CategoryBudgetSnapshot } from '@/entities/budget'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'

import {
  expenseFormDialogDescription,
  expenseFormDialogTitle,
} from '../lib/expenseFormDialogCopy'

import { CreateExpenseForm } from './CreateExpenseForm'

export type ExpenseFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  onClose: () => void
  categories: Category[]
  budgets: CategoryBudgetSnapshot[]
  incomes: Income[]
  allocations: Allocation[]
  selectedCategoryId?: string
  editingExpense?: Expense | null
  onStressCategoryChange?: (categoryId: string | null) => void
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  isEditing,
  onClose,
  categories,
  budgets,
  incomes,
  allocations,
  selectedCategoryId,
  editingExpense = null,
  onStressCategoryChange,
}: ExpenseFormDialogProps) {
  const formKey = editingExpense?.id ?? 'new'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90vh,40rem)] flex-col gap-4 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeader className="shrink-0 px-4 pt-5 pb-0">
          <DialogTitle>{expenseFormDialogTitle(isEditing)}</DialogTitle>
          <DialogDescription className="sr-only">
            {expenseFormDialogDescription(isEditing)}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
          <CreateExpenseForm
            key={formKey}
            variant="plain"
            categories={categories}
            budgets={budgets}
            incomes={incomes}
            allocations={allocations}
            selectedCategoryId={selectedCategoryId}
            editingExpense={editingExpense}
            onCancelEdit={onClose}
            onComplete={onClose}
            onStressCategoryChange={onStressCategoryChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
