import type { Allocation } from '@/entities/allocation/model/types'
import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'

import type { CategoryBudgetItem } from '../model/types'

import { buildAllExpenseBudgetItems } from './buildExpenseBudgetItems'
import { buildCategoryBudgets } from './buildCategoryBudgets'
import { shouldUseCycleEnvelopes } from './computeExpensePageOperationalSummary'

export type ResolveExpenseBudgetItemsForMonthParams = {
  month: string
  periodMonth: string
  currentCalendarMonth: string
  categories: readonly Category[]
  allocations: readonly Allocation[]
  expenses: readonly Expense[]
  incomes: readonly Income[]
  budgetCycle: BudgetCycleView | undefined
  /** Конверты выбранного периода (как на «Расход»), если цикл не активен. */
  periodBudgetItems: readonly CategoryBudgetItem[]
}

/** Конверты за месяц: цикл дохода для текущего месяца, иначе period/month rebuild. */
export function resolveExpenseBudgetItemsForMonth({
  month,
  periodMonth,
  currentCalendarMonth,
  categories,
  allocations,
  expenses,
  incomes,
  budgetCycle,
  periodBudgetItems,
}: ResolveExpenseBudgetItemsForMonthParams): CategoryBudgetItem[] {
  if (shouldUseCycleEnvelopes(month, currentCalendarMonth, budgetCycle)) {
    return buildAllExpenseBudgetItems(
      month,
      categories,
      allocations,
      expenses,
      incomes,
      budgetCycle,
      true,
    )
  }

  if (month === periodMonth) {
    return [...periodBudgetItems]
  }

  return buildCategoryBudgets(
    categories,
    allocations,
    expenses,
    incomes,
    month,
  )
}
