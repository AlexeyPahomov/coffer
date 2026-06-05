import type { Allocation } from '@/entities/allocation/model/types'
import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import { currentMonthInputValue } from '@/shared/lib/date'
import { buildPeriodMonthRange } from '@coffer/shared'

import type { CategoryBudgetItem } from '../model/types'

import { resolveExpenseBudgetItemsForMonth } from './resolveExpenseBudgetItemsForMonth'

type ResolveEnvelopeForecastInputsParams = {
  periodMonth: string
  forecastMonths: readonly string[]
  categories: readonly Category[]
  allocations: readonly Allocation[]
  expenses: readonly Expense[]
  incomes: readonly Income[]
  periodBudgetItems: readonly CategoryBudgetItem[]
  budgetCycle: BudgetCycleView | undefined
}

export function resolveEnvelopeForecastInputs({
  periodMonth,
  forecastMonths,
  categories,
  allocations,
  expenses,
  incomes,
  periodBudgetItems,
  budgetCycle,
}: ResolveEnvelopeForecastInputsParams) {
  const currentCalendarMonth = currentMonthInputValue()
  const startMonth =
    periodMonth < currentCalendarMonth ? periodMonth : currentCalendarMonth
  const endMonth = forecastMonths[forecastMonths.length - 1] ?? periodMonth
  const months = buildPeriodMonthRange(startMonth, endMonth)
  const initialPeriodMonth = months[0] ?? periodMonth

  const initialBudgetItems = resolveExpenseBudgetItemsForMonth({
    month: initialPeriodMonth,
    periodMonth,
    currentCalendarMonth,
    categories,
    allocations,
    expenses,
    incomes,
    budgetCycle,
    periodBudgetItems,
  })

  return { months, initialBudgetItems }
}
