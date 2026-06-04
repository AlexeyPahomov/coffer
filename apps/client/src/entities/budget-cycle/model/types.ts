import type { CategoryMonthSnapshotDto } from '@/entities/budget-month/model/types'

export type BudgetCycleIncome = {
  id: string
  amount: number
  source: string | null
  incomeType: string
  periodMonth: string
  receivedAt: string
}

export type BudgetCycleView = {
  asOf: string
  cycleStart: string
  cycleEnd: string | null
  income: BudgetCycleIncome
  snapshots: CategoryMonthSnapshotDto[]
}
