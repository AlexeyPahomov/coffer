import { filterAllocationsByPeriod } from '@/entities/allocation/lib/filterAllocationsByPeriod'
import { sumAllocationAmounts } from '@/entities/allocation/model/calculations'
import type { Expense } from '@/entities/expense/model/types'
import {
  computeFreePoolExpensesForPeriod,
  sumMoneyAmounts,
  toBudgetRebuildCategory,
} from '@coffer/shared'
import { filterReceivedAllocations } from '@/entities/allocation/lib/filterReceivedAllocations'
import { filterReceivedIncomes } from '@/entities/income/lib/incomeStatus'

import type { BudgetLedgerInput } from '../model/budgetLedgerInput'
import type { CategoryBudgetItem } from '../model/types'

import { sumExpenseOverspendCharge } from './envelopeOverspend'
import {
  mapAllocationsToBudgetRebuildRows,
  mapExpensesToBudgetRebuildRows,
} from './mapBudgetRebuildRows'
import { filterExpensesByPeriod, filterIncomesByPeriod } from './periodFilters'

export type PeriodLedgerTotals = {
  incomeTotal: number
  allocatedTotal: number
  spentTotal: number
  periodExpenses: Expense[]
}

export function resolvePeriodLedgerTotals(
  ledger: BudgetLedgerInput,
  periodMonth: string,
): PeriodLedgerTotals {
  const periodIncomes = filterReceivedIncomes(
    filterIncomesByPeriod(ledger.incomes, periodMonth),
  )
  const periodAllocations = filterReceivedAllocations(
    filterAllocationsByPeriod(ledger.allocations, periodMonth),
  )
  const periodExpenses = filterExpensesByPeriod(ledger.expenses, periodMonth)

  return {
    incomeTotal: sumMoneyAmounts(periodIncomes.map((income) => income.amount)),
    allocatedTotal: sumAllocationAmounts(periodAllocations),
    spentTotal: sumMoneyAmounts(
      periodExpenses.map((expense) => expense.amount),
    ),
    periodExpenses,
  }
}

export type FreePoolAvailableOverrides = {
  freePoolExpenseTotal?: number
  overspendCharge?: number
}

export function computeFreePoolAvailableForPeriod(
  ledger: BudgetLedgerInput,
  periodMonth: string,
  openingFreePool: number,
  budgetItems: readonly CategoryBudgetItem[],
  overrides?: FreePoolAvailableOverrides,
): number {
  const { incomeTotal, allocatedTotal, periodExpenses } =
    resolvePeriodLedgerTotals(ledger, periodMonth)

  const freePoolExpenseTotal =
    overrides?.freePoolExpenseTotal ??
    computeFreePoolExpensesForPeriod(
      ledger.categories.map(toBudgetRebuildCategory),
      mapAllocationsToBudgetRebuildRows(ledger.allocations),
      mapExpensesToBudgetRebuildRows(periodExpenses),
      periodMonth,
    )
  const overspendCharge =
    overrides?.overspendCharge ?? sumExpenseOverspendCharge(budgetItems)

  return (
    openingFreePool +
    incomeTotal -
    allocatedTotal -
    freePoolExpenseTotal +
    overspendCharge
  )
}
