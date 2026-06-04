import {
  computeRemaining,
  shouldAttributeExpenseToEnvelope,
  type CategoryMonthSnapshotState,
} from './budget.js'
import type { CarryOverPolicy } from './category.js'
import { getMonthKeyFromIso, isBeforePeriodMonth, isSamePeriodMonth } from './periodMonth.js'
import { toMoneyNumber, type MoneyInput } from '../lib/money.js'

export type BudgetRebuildCategory = {
  id: string
  type: string
  carry_over_policy?: CarryOverPolicy | string | null
}

export type CategoryBudgetRebuildInput = Pick<
  BudgetRebuildCategory,
  'id' | 'type' | 'carry_over_policy'
>

export function toBudgetRebuildCategory(
  category: CategoryBudgetRebuildInput,
): BudgetRebuildCategory {
  return {
    id: category.id,
    type: category.type,
    carry_over_policy: category.carry_over_policy,
  }
}

export type BudgetRebuildAllocation = {
  category_id: string
  amount: MoneyInput
  period_month: string
}

export type BudgetRebuildExpense = {
  category_id: string
  amount: MoneyInput
  date: string
}

export type RebuiltCategoryBudget = CategoryMonthSnapshotState & {
  categoryId: string
  closingBalance: number
}

type AmountRow = { category_id: string; amount: MoneyInput }

function sumByCategoryId(rows: readonly AmountRow[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const prev = totals.get(row.category_id) ?? 0
    totals.set(row.category_id, prev + toMoneyNumber(row.amount))
  }
  return totals
}

function shouldCarryOpeningBalance(category: BudgetRebuildCategory): boolean {
  return category.type === 'savings' || category.carry_over_policy === 'CARRY'
}

function getAllocationPeriodMonthKey(allocation: BudgetRebuildAllocation): string | undefined {
  return getMonthKeyFromIso(allocation.period_month)
}

function filterAllocationsByPeriod(
  allocations: readonly BudgetRebuildAllocation[],
  periodMonth: string,
): BudgetRebuildAllocation[] {
  return allocations.filter(
    (allocation) => getAllocationPeriodMonthKey(allocation) === periodMonth,
  )
}

function filterAllocationsBeforePeriod(
  allocations: readonly BudgetRebuildAllocation[],
  periodMonth: string,
): BudgetRebuildAllocation[] {
  return allocations.filter((allocation) => {
    const monthKey = getAllocationPeriodMonthKey(allocation)

    return monthKey != null && monthKey < periodMonth
  })
}

function filterExpensesByPeriod(
  expenses: readonly BudgetRebuildExpense[],
  periodMonth: string,
): BudgetRebuildExpense[] {
  return expenses.filter((expense) => isSamePeriodMonth(expense.date, periodMonth))
}

function filterExpensesBeforePeriod(
  expenses: readonly BudgetRebuildExpense[],
  periodMonth: string,
): BudgetRebuildExpense[] {
  return expenses.filter((expense) =>
    isBeforePeriodMonth(expense.date, periodMonth),
  )
}

/**
 * Детерминированный пересчёт конвертов за месяц из событий (derive / rebuild).
 */
export function computeCategoryBudgetsForPeriod(
  categories: readonly BudgetRebuildCategory[],
  allocations: readonly BudgetRebuildAllocation[],
  expenses: readonly BudgetRebuildExpense[],
  periodMonth: string,
): RebuiltCategoryBudget[] {
  const priorAllocations = filterAllocationsBeforePeriod(allocations, periodMonth)
  const priorExpenses = filterExpensesBeforePeriod(expenses, periodMonth)
  const periodAllocations = filterAllocationsByPeriod(allocations, periodMonth)
  const periodExpenses = filterExpensesByPeriod(expenses, periodMonth)

  const carriedFromAlloc = sumByCategoryId(priorAllocations)
  const spentBefore = sumByCategoryId(priorExpenses)
  const allocatedByCategory = sumByCategoryId(periodAllocations)
  const spentByCategory = sumByCategoryId(periodExpenses)

  return categories
    .filter((category) => category.type !== 'income')
    .map((category) => {
      const openingBalance =
        shouldCarryOpeningBalance(category)
          ? (carriedFromAlloc.get(category.id) ?? 0) -
            (spentBefore.get(category.id) ?? 0)
          : 0
      const allocated = allocatedByCategory.get(category.id) ?? 0
      const rawSpent = spentByCategory.get(category.id) ?? 0
      const envelopeSpent = shouldAttributeExpenseToEnvelope(
        category.type,
        openingBalance,
        allocated,
      )
        ? rawSpent
        : 0
      const closingBalance = computeRemaining(
        openingBalance,
        allocated,
        envelopeSpent,
      )

      return {
        categoryId: category.id,
        openingBalance,
        allocated,
        spent: rawSpent,
        closingBalance,
      }
    })
}

/** Сумма трат за месяц по категориям без лимита конверта (свободный пул). */
export function computeFreePoolExpensesForPeriod(
  categories: readonly BudgetRebuildCategory[],
  allocations: readonly BudgetRebuildAllocation[],
  expenses: readonly BudgetRebuildExpense[],
  periodMonth: string,
): number {
  const priorAllocations = filterAllocationsBeforePeriod(allocations, periodMonth)
  const priorExpenses = filterExpensesBeforePeriod(expenses, periodMonth)
  const periodAllocations = filterAllocationsByPeriod(allocations, periodMonth)
  const periodExpenses = filterExpensesByPeriod(expenses, periodMonth)

  const carriedFromAlloc = sumByCategoryId(priorAllocations)
  const spentBefore = sumByCategoryId(priorExpenses)
  const allocatedByCategory = sumByCategoryId(periodAllocations)
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  let total = 0
  for (const expense of periodExpenses) {
    const category = categoryById.get(expense.category_id)
    if (!category || category.type === 'income') {
      continue
    }

    const openingBalance = shouldCarryOpeningBalance(category)
      ? (carriedFromAlloc.get(category.id) ?? 0) -
        (spentBefore.get(category.id) ?? 0)
      : 0
    const allocated = allocatedByCategory.get(category.id) ?? 0

    if (
      !shouldAttributeExpenseToEnvelope(
        category.type,
        openingBalance,
        allocated,
      )
    ) {
      total += toMoneyNumber(expense.amount)
    }
  }

  return total
}
