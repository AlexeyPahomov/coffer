import type { Allocation } from '@/entities/allocation/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type {
  BudgetRebuildAllocation,
  BudgetRebuildExpense,
} from '@coffer/shared'

import { filterReceivedAllocations } from '@/entities/allocation/lib/filterReceivedAllocations'

export function mapAllocationsToBudgetRebuildRows(
  allocations: readonly Allocation[],
): BudgetRebuildAllocation[] {
  return filterReceivedAllocations(allocations).map((allocation) => ({
    category_id: allocation.category_id,
    amount: allocation.amount,
    period_month: allocation.period_month,
  }))
}

export function mapExpensesToBudgetRebuildRows(
  expenses: readonly Expense[],
): BudgetRebuildExpense[] {
  return expenses.map((expense) => ({
    category_id: expense.category_id,
    amount: expense.amount,
    date: expense.date,
  }))
}
