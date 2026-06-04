import { getAllocationPeriodMonthKey } from '@/entities/allocation/lib/getAllocationPeriodMonthKey'
import type { Allocation } from '@/entities/allocation/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import { getMonthKeyFromIso } from '@coffer/shared'

export function collectPeriodMonthKeys(
  incomes: readonly Income[],
  allocations: readonly Allocation[],
  expenses: readonly Expense[],
): string[] {
  const keys = new Set<string>()

  for (const income of incomes) {
    const key = getMonthKeyFromIso(income.period_month)
    if (key) {
      keys.add(key)
    }
  }

  for (const allocation of allocations) {
    const key = getAllocationPeriodMonthKey(allocation)
    if (key) {
      keys.add(key)
    }
  }

  for (const expense of expenses) {
    const key = getMonthKeyFromIso(expense.date)
    if (key) {
      keys.add(key)
    }
  }

  return [...keys].sort()
}

export function resolveEarliestPeriodMonth(
  incomes: readonly Income[],
  allocations: readonly Allocation[],
  expenses: readonly Expense[],
): string | undefined {
  return collectPeriodMonthKeys(incomes, allocations, expenses)[0]
}
