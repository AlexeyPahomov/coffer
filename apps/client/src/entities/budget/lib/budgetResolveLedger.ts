import type { Allocation } from '@/entities/allocation/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'

const EMPTY_ALLOCATIONS: readonly Allocation[] = []
const EMPTY_EXPENSES: readonly Expense[] = []
const EMPTY_INCOMES: readonly Income[] = []

export type BudgetResolveLedger = {
  allocations: readonly Allocation[]
  expenses: readonly Expense[]
  incomes: readonly Income[]
}

/** При trusted snapshot'ах derive не нужен — пустые массивы вместо полных списков. */
export function budgetResolveLedger(
  trustSnapshots: boolean,
  ledger: BudgetResolveLedger,
): BudgetResolveLedger {
  if (trustSnapshots) {
    return {
      allocations: EMPTY_ALLOCATIONS,
      expenses: EMPTY_EXPENSES,
      incomes: EMPTY_INCOMES,
    }
  }

  return ledger
}
