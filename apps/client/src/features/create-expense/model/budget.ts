import type { CategoryType } from '@coffer/shared'
import { parseMoneyInput } from '@coffer/shared'

import type { CategoryBudgetSnapshot } from '@/entities/budget'

export type ExpenseBudgetPreview = {
  categoryId: string
  categoryName: string
  categoryType: CategoryType
  allocated: number
  spent: number
  remainingBefore: number
  amount: number
  remainingAfter: number
  isOverBudget: boolean
  /** На сколько превысит лимит (0, если нет превышения). */
  overAmount: number
}

export type ComputeExpenseBudgetPreviewOptions = {
  /** Сумма расхода, уже учтённая в `budget.remaining` (редактирование той же категории). */
  replacedExpenseAmount?: number
}

export function computeExpenseBudgetPreview(
  budget: CategoryBudgetSnapshot,
  amountRaw: string,
  options?: ComputeExpenseBudgetPreviewOptions,
): ExpenseBudgetPreview | null {
  const amount = parseMoneyInput(amountRaw)
  if (amount === null || amount <= 0) {
    return null
  }

  const replacedExpenseAmount = options?.replacedExpenseAmount ?? 0
  const envelopeLimit = budget.carriedFromPrevious + budget.allocated
  const remainingBefore = budget.remaining
  const remainingAfter =
    remainingBefore + replacedExpenseAmount - amount
  const isOverBudget = envelopeLimit > 0 && remainingAfter < 0

  return {
    categoryId: budget.categoryId,
    categoryName: budget.categoryName,
    categoryType: budget.categoryType,
    allocated: budget.allocated,
    spent: budget.spent,
    remainingBefore,
    amount,
    remainingAfter,
    isOverBudget,
    overAmount: isOverBudget ? Math.abs(remainingAfter) : 0,
  }
}
