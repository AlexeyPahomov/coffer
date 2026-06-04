import {
  computeRemaining,
  shouldAttributeExpenseToEnvelope,
  type CategoryMonthSnapshotState,
} from './budget.js'
import type { CarryOverPolicy } from './category.js'
import { getCalendarDateKey, isDateInActiveCycle } from './calendarDate.js'
import { getMonthKeyFromIso } from './periodMonth.js'
import { toMoneyNumber, type MoneyInput } from '../lib/money.js'

export type ReceivedIncomeRow = {
  id: string
  status: string
  received_at: string | null
  /** Учётный месяц дохода `YYYY-MM` — закрытые месяцы не участвуют в активном цикле. */
  period_month?: string | null
}

export type ResolvedIncomeCycle = {
  /** Доход-аванс (начало цикла расходования). */
  incomeId: string
  cycleStart: string
  cycleEnd: string | null
}

function getDayOfMonth(dateKey: string): number {
  return Number(dateKey.slice(8, 10))
}

/** Расчёт зарплаты — обычно в начале месяца (до 12-го числа). */
export function isSettlementReceivedDate(dateKey: string): boolean {
  return getDayOfMonth(dateKey) <= 12
}

/** Аванс — обычно во второй половине месяца (с 13-го числа). */
export function isAdvanceReceivedDate(dateKey: string): boolean {
  return getDayOfMonth(dateKey) >= 13
}

export type BudgetCycleCategory = {
  id: string
  type: string
  carry_over_policy?: CarryOverPolicy | string | null
}

export type BudgetCycleAllocation = {
  category_id: string
  income_id: string
  income_received_at: string
  income_period_month: string
  allocation_period_month: string
  amount: MoneyInput
}

/** Закрытый учётный месяц (`BudgetMonth` CLOSED), ключ `YYYY-MM`. */
export function isClosedAccountingPeriod(
  periodMonthKey: string | undefined,
  closedPeriodMonths: ReadonlySet<string>,
): boolean {
  return (
    periodMonthKey != null &&
    periodMonthKey.length > 0 &&
    closedPeriodMonths.has(periodMonthKey)
  )
}

export function filterIncomesExcludingClosedPeriods(
  incomes: readonly ReceivedIncomeRow[],
  closedPeriodMonths: ReadonlySet<string>,
): ReceivedIncomeRow[] {
  if (closedPeriodMonths.size === 0) {
    return [...incomes]
  }

  return incomes.filter((income) => {
    const periodKey = getMonthKeyFromIso(income.period_month ?? '')
    return !isClosedAccountingPeriod(periodKey, closedPeriodMonths)
  })
}

export function filterAllocationsExcludingClosedPeriods(
  allocations: readonly BudgetCycleAllocation[],
  closedPeriodMonths: ReadonlySet<string>,
): BudgetCycleAllocation[] {
  if (closedPeriodMonths.size === 0) {
    return [...allocations]
  }

  return allocations.filter((allocation) => {
    const incomePeriod = getMonthKeyFromIso(allocation.income_period_month)
    const allocationPeriod = getMonthKeyFromIso(
      allocation.allocation_period_month,
    )
    return (
      !isClosedAccountingPeriod(incomePeriod, closedPeriodMonths) &&
      !isClosedAccountingPeriod(allocationPeriod, closedPeriodMonths)
    )
  })
}

export function filterExpensesExcludingClosedPeriods(
  expenses: readonly BudgetCycleExpense[],
  closedPeriodMonths: ReadonlySet<string>,
): BudgetCycleExpense[] {
  if (closedPeriodMonths.size === 0) {
    return [...expenses]
  }

  return expenses.filter((expense) => {
    const expensePeriod = getMonthKeyFromIso(expense.date)
    return !isClosedAccountingPeriod(expensePeriod, closedPeriodMonths)
  })
}

export type BudgetCycleExpense = {
  category_id: string
  amount: MoneyInput
  date: string
}

export type RebuiltCycleCategoryBudget = CategoryMonthSnapshotState & {
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

/** Перенос opening в цикле аванс→расчёт — только накопления. */
function shouldCarryOpeningInCycle(category: BudgetCycleCategory): boolean {
  return category.type === 'savings'
}

type ReceivedIncomeEntry = { id: string; received_at: string }

function mapReceivedIncomes(
  incomes: readonly ReceivedIncomeRow[],
): ReceivedIncomeEntry[] {
  return incomes
    .filter((income) => income.status === 'RECEIVED' && income.received_at != null)
    .map((income) => {
      const receivedAt = getCalendarDateKey(income.received_at!)
      if (!receivedAt) {
        return null
      }
      return { id: income.id, received_at: receivedAt }
    })
    .filter((row): row is ReceivedIncomeEntry => row != null)
    .sort((a, b) => a.received_at.localeCompare(b.received_at))
}

function sumAllocationsForIncome(
  allocations: readonly BudgetCycleAllocation[],
  incomeId: string,
): number {
  return allocations
    .filter((row) => row.income_id === incomeId)
    .reduce((sum, row) => sum + toMoneyNumber(row.amount), 0)
}

/** Основной аванс цикла — с наибольшей суммой распределений (отсекает лишний доход 21.05 и т.п.). */
function pickPrimaryAdvanceIncome(
  advances: readonly ReceivedIncomeEntry[],
  allocations: readonly BudgetCycleAllocation[],
): ReceivedIncomeEntry {
  if (advances.length === 1) {
    return advances[0]!
  }

  let best = advances[0]!
  let bestTotal = sumAllocationsForIncome(allocations, best.id)

  for (let index = 1; index < advances.length; index += 1) {
    const candidate = advances[index]!
    const total = sumAllocationsForIncome(allocations, candidate.id)
    if (total > bestTotal) {
      best = candidate
      bestTotal = total
    }
  }

  return best
}

/**
 * Активный цикл расходования: от аванса (после последнего расчёта) до следующего расчёта.
 * Несколько доходов между авансом и расчётом (например 22 и 25 мая) — один цикл.
 */
export function resolveActiveIncomeCycle(
  incomes: readonly ReceivedIncomeRow[],
  asOf: string,
  allocations: readonly BudgetCycleAllocation[] = [],
  closedPeriodMonths: ReadonlySet<string> = new Set(),
): ResolvedIncomeCycle | null {
  const asOfKey = getCalendarDateKey(asOf)
  if (!asOfKey) {
    return null
  }

  const received = mapReceivedIncomes(
    filterIncomesExcludingClosedPeriods(incomes, closedPeriodMonths),
  )
  if (received.length === 0) {
    return null
  }

  const settlementOnAsOf = received.find(
    (income) =>
      income.received_at === asOfKey &&
      isSettlementReceivedDate(income.received_at),
  )
  if (settlementOnAsOf) {
    const nextAfter = received.find((income) => income.received_at > asOfKey)
    return {
      incomeId: settlementOnAsOf.id,
      cycleStart: asOfKey,
      cycleEnd: nextAfter?.received_at ?? null,
    }
  }

  const cycleEndEntry = received.find((income) => income.received_at > asOfKey)
  const cycleEnd = cycleEndEntry?.received_at ?? null

  const activeAtAsOf = received.filter((income) => income.received_at <= asOfKey)
  if (activeAtAsOf.length === 0) {
    return null
  }

  const lastSettlementBeforeAsOf = [...activeAtAsOf]
    .filter((income) => income.received_at < asOfKey)
    .reverse()
    .find((income) => isSettlementReceivedDate(income.received_at))

  const lowerBoundExclusive = lastSettlementBeforeAsOf?.received_at ?? null

  const cycleMembers = received.filter((income) => {
    if (cycleEnd != null && income.received_at >= cycleEnd) {
      return false
    }
    if (income.received_at > asOfKey) {
      return false
    }
    if (
      lowerBoundExclusive != null &&
      income.received_at <= lowerBoundExclusive
    ) {
      return false
    }
    return true
  })

  if (cycleMembers.length === 0) {
    return null
  }

  const advancesInCycle = cycleMembers.filter((income) =>
    isAdvanceReceivedDate(income.received_at),
  )
  const primaryAdvance =
    advancesInCycle.length > 0
      ? pickPrimaryAdvanceIncome(advancesInCycle, allocations)
      : (cycleMembers[0] ?? null)

  if (!primaryAdvance) {
    return null
  }

  return {
    incomeId: primaryAdvance.id,
    cycleStart: primaryAdvance.received_at,
    cycleEnd,
  }
}

function filterAllocationsBeforeCycle(
  allocations: readonly BudgetCycleAllocation[],
  cycleStart: string,
): BudgetCycleAllocation[] {
  return allocations.filter(
    (allocation) => allocation.income_received_at < cycleStart,
  )
}

function filterAllocationsInCycle(
  allocations: readonly BudgetCycleAllocation[],
  cycle: ResolvedIncomeCycle,
): BudgetCycleAllocation[] {
  return allocations.filter((allocation) => {
    const receivedAt = allocation.income_received_at
    if (receivedAt < cycle.cycleStart) {
      return false
    }
    if (cycle.cycleEnd != null && receivedAt >= cycle.cycleEnd) {
      return false
    }
    return true
  })
}

function filterExpensesBeforeCycle(
  expenses: readonly BudgetCycleExpense[],
  cycleStart: string,
): BudgetCycleExpense[] {
  return expenses.filter((expense) => {
    const dateKey = getCalendarDateKey(expense.date)
    return dateKey != null && dateKey < cycleStart
  })
}

function filterExpensesInCycle(
  expenses: readonly BudgetCycleExpense[],
  cycle: ResolvedIncomeCycle,
  asOfKey: string,
): BudgetCycleExpense[] {
  return expenses.filter((expense) => {
    const dateKey = getCalendarDateKey(expense.date)
    if (!dateKey) {
      return false
    }
    return isDateInActiveCycle(
      dateKey,
      cycle.cycleStart,
      cycle.cycleEnd,
      asOfKey,
    )
  })
}

/**
 * Конверты за активный доходный цикл: opening только у накоплений;
 * расходные конверты = распределения в цикле − траты в цикле (без переноса до аванса).
 */
export function computeCategoryBudgetsForCycle(
  categories: readonly BudgetCycleCategory[],
  allocations: readonly BudgetCycleAllocation[],
  expenses: readonly BudgetCycleExpense[],
  cycle: ResolvedIncomeCycle,
  asOf: string,
  closedPeriodMonths: ReadonlySet<string> = new Set(),
): RebuiltCycleCategoryBudget[] {
  const asOfKey = getCalendarDateKey(asOf)
  if (!asOfKey) {
    return []
  }

  const activeAllocations = filterAllocationsExcludingClosedPeriods(
    allocations,
    closedPeriodMonths,
  )
  const activeExpenses = filterExpensesExcludingClosedPeriods(
    expenses,
    closedPeriodMonths,
  )

  const priorAllocations = filterAllocationsBeforeCycle(
    activeAllocations,
    cycle.cycleStart,
  )
  const priorExpenses = filterExpensesBeforeCycle(activeExpenses, cycle.cycleStart)
  const cycleAllocations = filterAllocationsInCycle(activeAllocations, cycle)
  const cycleExpenses = filterExpensesInCycle(activeExpenses, cycle, asOfKey)

  const carriedFromAlloc = sumByCategoryId(priorAllocations)
  const spentBefore = sumByCategoryId(priorExpenses)
  const allocatedByCategory = sumByCategoryId(cycleAllocations)
  const spentByCategory = sumByCategoryId(cycleExpenses)

  return categories
    .filter((category) => category.type !== 'income')
    .map((category) => {
      const openingBalance = shouldCarryOpeningInCycle(category)
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

/** Сумма трат в цикле по категориям без лимита конверта (свободный пул). */
export function computeFreePoolExpensesForCycle(
  categories: readonly BudgetCycleCategory[],
  allocations: readonly BudgetCycleAllocation[],
  expenses: readonly BudgetCycleExpense[],
  cycle: ResolvedIncomeCycle,
  asOf: string,
  closedPeriodMonths: ReadonlySet<string> = new Set(),
): number {
  const asOfKey = getCalendarDateKey(asOf)
  if (!asOfKey) {
    return 0
  }

  const activeAllocations = filterAllocationsExcludingClosedPeriods(
    allocations,
    closedPeriodMonths,
  )
  const activeExpenses = filterExpensesExcludingClosedPeriods(
    expenses,
    closedPeriodMonths,
  )

  const priorAllocations = filterAllocationsBeforeCycle(
    activeAllocations,
    cycle.cycleStart,
  )
  const priorExpenses = filterExpensesBeforeCycle(activeExpenses, cycle.cycleStart)
  const cycleAllocations = filterAllocationsInCycle(activeAllocations, cycle)
  const cycleExpenses = filterExpensesInCycle(activeExpenses, cycle, asOfKey)

  const carriedFromAlloc = sumByCategoryId(priorAllocations)
  const spentBefore = sumByCategoryId(priorExpenses)
  const allocatedByCategory = sumByCategoryId(cycleAllocations)
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  let total = 0
  for (const expense of cycleExpenses) {
    const category = categoryById.get(expense.category_id)
    if (!category || category.type === 'income') {
      continue
    }

    const openingBalance = shouldCarryOpeningInCycle(category)
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
