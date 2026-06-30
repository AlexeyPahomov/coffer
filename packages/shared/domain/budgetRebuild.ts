import {
  computeRemaining,
  shouldAttributeExpenseToEnvelope,
  type CategoryMonthSnapshotState,
} from './budget.js'
import type { CarryOverPolicy } from './category.js'
import { getMonthKeyFromIso, isSamePeriodMonth } from './periodMonth.js'
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
  /** Fallback, если `period_month` не парсится (как на странице «Бюджет»). */
  income_period_month?: string | null
}

export type BudgetRebuildExpense = {
  category_id: string
  amount: MoneyInput
  date: string
}

export type BudgetTransfer = {
  from_category_id: string
  /** null = списание из накоплений в свободный пул (без конверта-получателя). */
  to_category_id: string | null
  amount: MoneyInput
  period_month: string
}

/**
 * Перевод раскладывается в знаковые allocation-строки:
 * −amount у источника и (если есть получатель) +amount у него в том же периоде.
 *
 * - Перевод конверт→конверт (to ≠ null): две строки, сумма дельт = 0 → суммарный
 *   allocated не меняется (money-инвариант), деньги переезжают между конвертами.
 * - Списание в свободный пул (to = null): одна строка −amount у источника. Суммарный
 *   allocated падает на amount → свободный пул растёт на amount (деньги «распакованы»).
 *
 * Раскладка нужна, чтобы rebuild и инкрементальный проектор видели эффект одинаково.
 */
export function expandTransfersToAllocations(
  transfers: readonly BudgetTransfer[],
): BudgetRebuildAllocation[] {
  const rows: BudgetRebuildAllocation[] = []
  for (const transfer of transfers) {
    const amount = toMoneyNumber(transfer.amount)
    rows.push({
      category_id: transfer.from_category_id,
      amount: -amount,
      period_month: transfer.period_month,
    })
    if (transfer.to_category_id != null) {
      rows.push({
        category_id: transfer.to_category_id,
        amount,
        period_month: transfer.period_month,
      })
    }
  }
  return rows
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

function sumCategoryAllocationsBeforePeriod(
  allocations: readonly BudgetRebuildAllocation[],
  categoryId: string,
  periodMonth: string,
): number {
  let total = 0
  for (const allocation of allocations) {
    if (allocation.category_id !== categoryId) {
      continue
    }
    const monthKey = getAllocationPeriodMonthKey(allocation)
    if (monthKey != null && monthKey < periodMonth) {
      total += toMoneyNumber(allocation.amount)
    }
  }
  return total
}

function sumCategoryAllocationsInPeriod(
  allocations: readonly BudgetRebuildAllocation[],
  categoryId: string,
  periodMonth: string,
): number {
  let total = 0
  for (const allocation of allocations) {
    if (allocation.category_id !== categoryId) {
      continue
    }
    if (getAllocationPeriodMonthKey(allocation) === periodMonth) {
      total += toMoneyNumber(allocation.amount)
    }
  }
  return total
}

function sumCategoryExpensesInPeriod(
  expenses: readonly BudgetRebuildExpense[],
  categoryId: string,
  periodMonth: string,
): number {
  let total = 0
  for (const expense of expenses) {
    if (
      expense.category_id === categoryId &&
      isSamePeriodMonth(expense.date, periodMonth)
    ) {
      total += toMoneyNumber(expense.amount)
    }
  }
  return total
}

function collectCategoryPeriodMonthsBefore(
  allocations: readonly BudgetRebuildAllocation[],
  expenses: readonly BudgetRebuildExpense[],
  categoryId: string,
  periodMonth: string,
): string[] {
  const months = new Set<string>()

  for (const allocation of allocations) {
    if (allocation.category_id !== categoryId) {
      continue
    }
    const monthKey = getAllocationPeriodMonthKey(allocation)
    if (monthKey != null && monthKey < periodMonth) {
      months.add(monthKey)
    }
  }

  for (const expense of expenses) {
    if (expense.category_id !== categoryId) {
      continue
    }
    const monthKey = getMonthKeyFromIso(expense.date)
    if (monthKey != null && monthKey < periodMonth) {
      months.add(monthKey)
    }
  }

  return [...months].sort()
}

/** Только траты, реально списанные с конверта в прошлых месяцах. */
function computeEnvelopeAttributedSpentBefore(
  category: BudgetRebuildCategory,
  allocations: readonly BudgetRebuildAllocation[],
  expenses: readonly BudgetRebuildExpense[],
  periodMonth: string,
): number {
  if (!shouldCarryOpeningBalance(category)) {
    return 0
  }

  let envelopeSpentBefore = 0

  for (const month of collectCategoryPeriodMonthsBefore(
    allocations,
    expenses,
    category.id,
    periodMonth,
  )) {
    const openingAtMonth =
      sumCategoryAllocationsBeforePeriod(allocations, category.id, month) -
      envelopeSpentBefore
    const allocatedInMonth = sumCategoryAllocationsInPeriod(
      allocations,
      category.id,
      month,
    )
    const rawSpentInMonth = sumCategoryExpensesInPeriod(
      expenses,
      category.id,
      month,
    )

    if (
      shouldAttributeExpenseToEnvelope(
        category.type,
        openingAtMonth,
        allocatedInMonth,
      )
    ) {
      envelopeSpentBefore += rawSpentInMonth
    }
  }

  return envelopeSpentBefore
}

function resolveCarriedOpeningBalance(
  category: BudgetRebuildCategory,
  allocations: readonly BudgetRebuildAllocation[],
  expenses: readonly BudgetRebuildExpense[],
  periodMonth: string,
): number {
  if (!shouldCarryOpeningBalance(category)) {
    return 0
  }

  return (
    sumCategoryAllocationsBeforePeriod(allocations, category.id, periodMonth) -
    computeEnvelopeAttributedSpentBefore(
      category,
      allocations,
      expenses,
      periodMonth,
    )
  )
}

export function resolveAllocationPeriodMonthKey(
  allocation: Pick<BudgetRebuildAllocation, 'period_month' | 'income_period_month'>,
): string | undefined {
  return (
    getMonthKeyFromIso(allocation.period_month) ??
    (allocation.income_period_month
      ? getMonthKeyFromIso(allocation.income_period_month)
      : undefined)
  )
}

function getAllocationPeriodMonthKey(allocation: BudgetRebuildAllocation): string | undefined {
  return resolveAllocationPeriodMonthKey(allocation)
}

function filterAllocationsByPeriod(
  allocations: readonly BudgetRebuildAllocation[],
  periodMonth: string,
): BudgetRebuildAllocation[] {
  return allocations.filter(
    (allocation) => getAllocationPeriodMonthKey(allocation) === periodMonth,
  )
}

function filterExpensesByPeriod(
  expenses: readonly BudgetRebuildExpense[],
  periodMonth: string,
): BudgetRebuildExpense[] {
  return expenses.filter((expense) => isSamePeriodMonth(expense.date, periodMonth))
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
  const periodAllocations = filterAllocationsByPeriod(allocations, periodMonth)
  const periodExpenses = filterExpensesByPeriod(expenses, periodMonth)

  const allocatedByCategory = sumByCategoryId(periodAllocations)
  const spentByCategory = sumByCategoryId(periodExpenses)

  return categories
    .filter((category) => category.type !== 'income')
    .map((category) => {
      const openingBalance = resolveCarriedOpeningBalance(
        category,
        allocations,
        expenses,
        periodMonth,
      )
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
  const periodAllocations = filterAllocationsByPeriod(allocations, periodMonth)
  const periodExpenses = filterExpensesByPeriod(expenses, periodMonth)

  const allocatedByCategory = sumByCategoryId(periodAllocations)
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  let total = 0
  for (const expense of periodExpenses) {
    const category = categoryById.get(expense.category_id)
    if (!category || category.type === 'income') {
      continue
    }

    const openingBalance = resolveCarriedOpeningBalance(
      category,
      allocations,
      expenses,
      periodMonth,
    )
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
