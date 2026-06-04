import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'

/** Общий набор событий для пересчёта конвертов и свободных средств. */
export type BudgetLedgerInput = {
  categories: readonly Category[]
  incomes: readonly Income[]
  allocations: readonly Allocation[]
  expenses: readonly Expense[]
}
