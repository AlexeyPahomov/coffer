import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { BudgetCycleView } from '@/entities/budget-cycle/model/types'
import type { BudgetMonthView } from '@/entities/budget-month/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PeriodLedgerSummary } from '@/entities/period-ledger-summary'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

export type AppBootstrap = {
  periodMonth: string
  asOf: string
  categories: Category[]
  incomes: Income[]
  plannedExpenses: PlannedExpense[]
  allocationRules: AllocationRule[]
  budgetCycle: BudgetCycleView | null
  budgetMonth: BudgetMonthView
  periodLedgerSummary: PeriodLedgerSummary
}
