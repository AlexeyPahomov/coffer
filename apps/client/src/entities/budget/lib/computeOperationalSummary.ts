import { filterAllocationsByPeriod } from '@/entities/allocation/lib/filterAllocationsByPeriod'
import { sumAllocationAmounts } from '@/entities/allocation/model/calculations'
import { isSavingsCategory } from '@/entities/category/lib/categoryKind'
import type { Allocation } from '@/entities/allocation/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { buildMonthProjection } from '@coffer/planning-core'
import { sumMoneyAmounts } from '@coffer/shared'
import { filterReceivedIncomes } from '@/entities/income/lib/incomeStatus'
import { filterReceivedAllocations } from '@/entities/allocation/lib/filterReceivedAllocations'

import type { CategoryBudgetItem } from '../model/types'
import type { OperationalSummary } from '../model/operationalSummary'

import { getCarryForwardMeta } from './carryForward'
import { filterExpensesByPeriod, filterIncomesByPeriod } from './periodFilters'
import { formatPeriodMonthLabel } from './periodLabels'

function sumSavingsInReserve(
  budgetItems: readonly CategoryBudgetItem[],
): number {
  return budgetItems
    .filter((item) => isSavingsCategory(item.category.type))
    .reduce((sum, item) => sum + Math.max(0, item.remaining), 0)
}

/** Сумма отрицательных остатков расходных конвертов (перерасход «съел» свободный пул). */
function sumExpenseOverspendCharge(
  budgetItems: readonly CategoryBudgetItem[],
): number {
  return budgetItems
    .filter((item) => !isSavingsCategory(item.category.type))
    .reduce((sum, item) => sum + Math.min(0, item.remaining), 0)
}

/**
 * Операционная сводка за месяц по уже посчитанным конвертам (без повторного build).
 */
export function computeOperationalSummary(
  budgetItems: readonly CategoryBudgetItem[],
  incomes: readonly Income[],
  allocations: readonly Allocation[],
  expenses: readonly Expense[],
  periodMonth: string,
  plannedExpenses: readonly PlannedExpense[] = [],
): OperationalSummary {
  const periodIncomes = filterReceivedIncomes(
    filterIncomesByPeriod(incomes, periodMonth),
  )
  const periodAllocations = filterReceivedAllocations(
    filterAllocationsByPeriod(allocations, periodMonth),
  )
  const periodExpenses = filterExpensesByPeriod(expenses, periodMonth)

  const incomeTotal = sumMoneyAmounts(
    periodIncomes.map((income) => income.amount),
  )
  const spentThisMonth = sumMoneyAmounts(
    periodExpenses.map((expense) => expense.amount),
  )
  const allocatedTotal = sumAllocationAmounts(periodAllocations)
  const inReserve = sumSavingsInReserve(budgetItems)
  const overspendCharge = sumExpenseOverspendCharge(budgetItems)
  const available = incomeTotal - allocatedTotal + overspendCharge
  const { total: carryForwardTotal, previousPeriodLabel } =
    getCarryForwardMeta(periodMonth, budgetItems)

  const savingsItem = budgetItems.find((item) =>
    isSavingsCategory(item.category.type),
  )

  const projection = buildMonthProjection({
    available,
    spentTotal: spentThisMonth,
    commitmentRows: plannedExpenses.map((row) => ({
      amount: row.amount,
      reserved_amount: row.reserved_amount,
      status: row.status,
    })),
  })

  return {
    periodMonth,
    periodLabel: formatPeriodMonthLabel(periodMonth),
    incomeTotal,
    allocatedTotal,
    available,
    inReserve,
    spentThisMonth,
    carryForwardTotal,
    previousPeriodLabel,
    plannedTotal: projection.plannedTotal,
    reservedTotal: projection.reservedTotal,
    projectedFree: projection.projectedFree,
    reserveCategory: savingsItem
      ? {
          name: savingsItem.category.name,
          icon: savingsItem.category.icon,
          type: savingsItem.category.type,
        }
      : undefined,
  }
}
