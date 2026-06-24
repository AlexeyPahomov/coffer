import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Allocation } from '@/entities/allocation/model/types'
import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { BudgetMonthView } from '@/entities/budget-month/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

export type AppBootstrap = {
  periodMonth: string
  asOf: string
  categories: Category[]
  incomes: Income[]
  allocations: Allocation[]
  expenses: Expense[]
  plannedExpenses: PlannedExpense[]
  allocationRules: AllocationRule[]
  budgetCycle: BudgetCycleView | null
  budgetMonth: BudgetMonthView
}
