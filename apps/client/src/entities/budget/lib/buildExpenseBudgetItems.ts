import { mapBudgetCycleToCategoryItems } from '@/entities/budget-cycle/lib/mapBudgetCycleToCategoryItems'
import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'

import type { CategoryBudgetItem } from '../model/types'

import { buildCategoryBudgets, sortBudgetItemsForDisplay } from './buildCategoryBudgets'
import { filterExpenseEnvelopeBudgetItems } from './filterExpenseEnvelopeBudgetItems'

export function buildAllExpenseBudgetItems(
  periodMonth: string,
  categories: readonly Category[],
  allocations: readonly Allocation[],
  expenses: readonly Expense[],
  incomes: readonly Income[],
  budgetCycle: BudgetCycleView | undefined,
  useCycleEnvelopes: boolean,
): CategoryBudgetItem[] {
  if (useCycleEnvelopes && budgetCycle) {
    return mapBudgetCycleToCategoryItems(budgetCycle, categories)
  }

  return buildCategoryBudgets(
    categories,
    allocations,
    expenses,
    incomes,
    periodMonth,
  )
}

export function toDisplayExpenseBudgetItems(
  items: readonly CategoryBudgetItem[],
): CategoryBudgetItem[] {
  return sortBudgetItemsForDisplay(filterExpenseEnvelopeBudgetItems(items))
}
