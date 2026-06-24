import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Allocation } from '@/entities/allocation/model/types'
import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { BudgetMonthView } from '@/entities/budget-month/model/types'
import type { Category } from '@/entities/category/model/types'
import {
  mapExpenseFromApiRow,
  type ExpenseApiRow,
} from '@/entities/expense/api/expenseApi'
import { normalizeIncomeFromApi } from '@/entities/income/api/incomeApi'
import type { Income } from '@/entities/income/model/types'
import {
  mapPlannedExpenseFromApiRow,
  type PlannedExpenseApiRow,
} from '@/entities/planned-expense/api/plannedExpenseApi'
import { apiGet } from '@/shared/api/client'
import { DEV_USER_ID } from '@/shared/lib/constants'

import type { AppBootstrap } from '../model/types'

type BootstrapApiResponse = {
  periodMonth: string
  asOf: string
  categories: Category[]
  incomes: Income[]
  allocations: Allocation[]
  expenses: ExpenseApiRow[]
  plannedExpenses: PlannedExpenseApiRow[]
  allocationRules: AllocationRule[]
  budgetCycle: BudgetCycleView | null
  budgetMonth: BudgetMonthView
}

function mapBootstrap(response: BootstrapApiResponse): AppBootstrap {
  return {
    periodMonth: response.periodMonth,
    asOf: response.asOf,
    categories: response.categories,
    incomes: response.incomes.map(normalizeIncomeFromApi),
    allocations: response.allocations,
    expenses: response.expenses.map(mapExpenseFromApiRow),
    plannedExpenses: response.plannedExpenses.map(mapPlannedExpenseFromApiRow),
    allocationRules: response.allocationRules,
    budgetCycle: response.budgetCycle,
    budgetMonth: response.budgetMonth,
  }
}

export async function fetchBootstrap(
  periodMonth: string,
  asOf: string,
): Promise<AppBootstrap> {
  const q = new URLSearchParams({
    user_id: DEV_USER_ID,
    period_month: periodMonth,
    as_of: asOf,
  })
  const response = await apiGet<BootstrapApiResponse>(`/bootstrap?${q}`)
  return mapBootstrap(response)
}
