import type { Allocation } from '@/entities/allocation/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { BudgetRebuildExpense } from '@coffer/shared'

import { filterReceivedAllocations } from '@/entities/allocation/lib/filterReceivedAllocations'
import { toBudgetRebuildAllocation } from '@/entities/allocation/lib/toBudgetRebuildAllocation'

export function mapAllocationsToBudgetRebuildRows(
  allocations: readonly Allocation[],
) {
  return filterReceivedAllocations(allocations).map(toBudgetRebuildAllocation)
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
