import type { Allocation } from '@/entities/allocation/model/types'
import { buildCategoryBudgets } from '@/entities/budget/lib/buildCategoryBudgets'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import { currentMonthInputValue } from '@/shared/lib/date'
import { buildPeriodMonthRange } from '@coffer/shared'

type ResolveEnvelopeForecastInputsParams = {
  periodMonth: string
  forecastMonths: readonly string[]
  categories: readonly Category[]
  allocations: readonly Allocation[]
  expenses: readonly Expense[]
  incomes: readonly Income[]
  budgetItems: readonly CategoryBudgetItem[]
}

export function resolveEnvelopeForecastInputs({
  periodMonth,
  forecastMonths,
  categories,
  allocations,
  expenses,
  incomes,
  budgetItems,
}: ResolveEnvelopeForecastInputsParams) {
  const currentCalendarMonth = currentMonthInputValue()
  const startMonth =
    periodMonth < currentCalendarMonth ? periodMonth : currentCalendarMonth
  const endMonth = forecastMonths[forecastMonths.length - 1] ?? periodMonth
  const months = buildPeriodMonthRange(startMonth, endMonth)
  const initialPeriodMonth = months[0]

  const initialBudgetItems =
    !initialPeriodMonth || initialPeriodMonth === periodMonth
      ? budgetItems
      : buildCategoryBudgets(
          categories,
          allocations,
          expenses,
          incomes,
          initialPeriodMonth,
        )

  return { months, initialBudgetItems }
}
