import {
  computeRemaining,
  shouldAttributeExpenseToEnvelope,
  type CategoryMonthSnapshotState,
} from './budget.js'
import type { CarryOverPolicy } from './category.js'
import { canAnchorIncomeCycle } from './incomeType.js'
import { getCalendarDateKey, isDateInActiveCycle, subtractCalendarDays } from './calendarDate.js'
import { getMonthKeyFromIso } from './periodMonth.js'
import { toMoneyNumber, type MoneyInput } from '../lib/money.js'

export type ReceivedIncomeRow = {
  id: string
  status: string
  received_at: string | null
  /** Учётный месяц дохода `YYYY-MM` — закрытые месяцы не участвуют в активном цикле. */
  period_month?: string | null
  income_type?: string | null
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

export type BudgetCycleTransfer = {
  from_category_id: string
  /** null = списание из накоплений в свободный пул (без конверта-получателя). */
  to_category_id: string | null
  amount: MoneyInput
  /** Учётный месяц перевода — для отсева закрытых периодов. */
  period_month: string
  /** Реальный момент записи — якорь привязки к циклу (как дата расхода). */
  created_at: string
}

/**
 * Перевод раскладывается в знаковые цикловые allocation-строки — как
 * `expandTransfersToAllocations` для месячной системы, но с якорем цикла.
 *
 * - `income_received_at = created_at`: перевод слотуется в окно цикла по реальной
 *   дате записи (как расход), а не по учётному месяцу.
 * - `income_period_month`/`allocation_period_month = period_month`: отсев закрытых
 *   периодов остаётся учётным.
 * - Синтетический `income_id` не совпадает ни с одним доходом → не влияет на выбор
 *   аванса цикла (`pickPrimaryAdvanceIncome`).
 */
export function expandTransfersToCycleAllocations(
  transfers: readonly BudgetCycleTransfer[],
): BudgetCycleAllocation[] {
  const rows: BudgetCycleAllocation[] = []
  for (const transfer of transfers) {
    const receivedAt = getCalendarDateKey(transfer.created_at)
    const periodMonth = getMonthKeyFromIso(transfer.period_month)
    if (!receivedAt || !periodMonth) {
      continue
    }

    const amount = toMoneyNumber(transfer.amount)
    const base = {
      income_id: `transfer:${transfer.from_category_id}:${receivedAt}`,
      income_received_at: receivedAt,
      income_period_month: periodMonth,
      allocation_period_month: periodMonth,
    }

    rows.push({ ...base, category_id: transfer.from_category_id, amount: -amount })
    if (transfer.to_category_id != null) {
      rows.push({ ...base, category_id: transfer.to_category_id, amount })
    }
  }
  return rows
}

function mergeTransfersIntoCycleAllocations(
  allocations: readonly BudgetCycleAllocation[],
  transfers: readonly BudgetCycleTransfer[],
  asOfKey: string,
): BudgetCycleAllocation[] {
  if (transfers.length === 0) {
    return [...allocations]
  }
  // Перевод учитывается только записанный не позже asOf — как расход
  // (filterExpensesInCycle ограничивает дату сверху; путь аллокаций — нет).
  const transfersAsOf = transfers.filter((transfer) => {
    const receivedAt = getCalendarDateKey(transfer.created_at)
    return receivedAt != null && receivedAt <= asOfKey
  })
  return [...allocations, ...expandTransfersToCycleAllocations(transfersAsOf)]
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

function filterActiveReceivedIncomes(
  incomes: readonly ReceivedIncomeRow[],
  closedPeriodMonths: ReadonlySet<string>,
): ReceivedIncomeRow[] {
  return filterIncomesExcludingClosedPeriods(incomes, closedPeriodMonths).filter(
    (income) => income.status === 'RECEIVED' && income.received_at != null,
  )
}

function mapReceivedIncomes(
  activeIncomeRows: readonly ReceivedIncomeRow[],
): ReceivedIncomeEntry[] {
  return activeIncomeRows
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

function settlementAnchoredCycle(
  settlement: ReceivedIncomeEntry,
  cycleEnd: string | null,
): ResolvedIncomeCycle {
  return {
    incomeId: settlement.id,
    cycleStart: settlement.received_at,
    cycleEnd,
  }
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

  const activeIncomeRows = filterActiveReceivedIncomes(incomes, closedPeriodMonths)
  const incomeById = new Map(
    activeIncomeRows.map((income) => [income.id, income]),
  )

  const received = mapReceivedIncomes(activeIncomeRows)
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
    return lastSettlementBeforeAsOf
      ? settlementAnchoredCycle(lastSettlementBeforeAsOf, cycleEnd)
      : null
  }

  const anchorableAdvances = cycleMembers
    .filter((income) => isAdvanceReceivedDate(income.received_at))
    .filter((income) => canAnchorIncomeCycle(incomeById.get(income.id)?.income_type))

  if (anchorableAdvances.length === 0) {
    return lastSettlementBeforeAsOf
      ? settlementAnchoredCycle(lastSettlementBeforeAsOf, cycleEnd)
      : null
  }

  const primaryAdvance = pickPrimaryAdvanceIncome(anchorableAdvances, allocations)

  return {
    incomeId: primaryAdvance.id,
    cycleStart: primaryAdvance.received_at,
    cycleEnd,
  }
}

/** Цикл расходования, активный накануне начала текущего. */
export function resolvePreviousIncomeCycle(
  incomes: readonly ReceivedIncomeRow[],
  cycle: ResolvedIncomeCycle,
  allocations: readonly BudgetCycleAllocation[],
  closedPeriodMonths: ReadonlySet<string> = new Set(),
): ResolvedIncomeCycle | null {
  const asOfKey = subtractCalendarDays(cycle.cycleStart, 1)
  if (!asOfKey) {
    return null
  }

  return resolveActiveIncomeCycle(
    incomes,
    asOfKey,
    allocations,
    closedPeriodMonths,
  )
}

function shouldCarryExpenseFromPreviousCycle(category: BudgetCycleCategory): boolean {
  return category.type === 'expense' && category.carry_over_policy === 'CARRY'
}

/**
 * Остаток предыдущего цикла для переноса в следующий аванс.
 * После расчёта с новым лимитом — closing как есть.
 * После расчёта без лимита, но с остатком из аванса:
 * - если тратили из переноса, но не всё — deficit carry как spent − opening;
 * - неиспользованный остаток в расчёте на новый аванс не переносим.
 */
function resolveCarryOpeningFromPreviousCycle(
  previousCycle: ResolvedIncomeCycle,
  row: RebuiltCycleCategoryBudget,
): number {
  if (!isSettlementReceivedDate(previousCycle.cycleStart)) {
    return row.closingBalance
  }

  const carriedWithoutNewLimit =
    row.allocated === 0 && row.openingBalance > 0

  if (!carriedWithoutNewLimit) {
    return row.closingBalance
  }

  if (row.spent === 0) {
    return 0
  }

  if (row.spent < row.openingBalance) {
    return row.spent - row.openingBalance
  }

  return row.closingBalance
}

function buildPreviousCycleCarryOpeningByCategory(
  categories: readonly BudgetCycleCategory[],
  allocations: readonly BudgetCycleAllocation[],
  expenses: readonly BudgetCycleExpense[],
  cycle: ResolvedIncomeCycle,
  closedPeriodMonths: ReadonlySet<string>,
  incomes: readonly ReceivedIncomeRow[],
): Map<string, number> {
  if (incomes.length === 0) {
    return new Map()
  }

  const previousCycle = resolvePreviousIncomeCycle(
    incomes,
    cycle,
    allocations,
    closedPeriodMonths,
  )
  if (!previousCycle) {
    return new Map()
  }

  const asOfKey = subtractCalendarDays(cycle.cycleStart, 1)
  if (!asOfKey) {
    return new Map()
  }

  const carryCategoryIds = new Set(
    categories
      .filter(shouldCarryExpenseFromPreviousCycle)
      .map((category) => category.id),
  )
  if (carryCategoryIds.size === 0) {
    return new Map()
  }

  // Авансовый цикл на экране считается с opening=0; при переносе в следующий
  // аванс не подмешиваем остаток из ещё более раннего расчёта.
  const carryIncomes = isSettlementReceivedDate(previousCycle.cycleStart)
    ? incomes
    : []

  const previousBudgets = computeCategoryBudgetsForCycle(
    categories,
    allocations,
    expenses,
    previousCycle,
    asOfKey,
    closedPeriodMonths,
    carryIncomes,
  )

  const carryByCategoryId = new Map<string, number>()
  for (const row of previousBudgets) {
    if (!carryCategoryIds.has(row.categoryId)) {
      continue
    }
    carryByCategoryId.set(
      row.categoryId,
      resolveCarryOpeningFromPreviousCycle(previousCycle, row),
    )
  }

  return carryByCategoryId
}

type CycleLedgerTotals = {
  carriedFromAlloc: Map<string, number>
  spentBefore: Map<string, number>
  allocatedByCategory: Map<string, number>
  spentByCategory: Map<string, number>
  previousCycleCarryOpening: Map<string, number>
}

function prepareCycleLedgerTotals(
  categories: readonly BudgetCycleCategory[],
  allocations: readonly BudgetCycleAllocation[],
  expenses: readonly BudgetCycleExpense[],
  cycle: ResolvedIncomeCycle,
  asOfKey: string,
  closedPeriodMonths: ReadonlySet<string>,
  incomes: readonly ReceivedIncomeRow[],
): CycleLedgerTotals {
  const priorAllocations = filterAllocationsBeforeCycle(
    allocations,
    cycle.cycleStart,
  )
  const priorExpenses = filterExpensesBeforeCycle(expenses, cycle.cycleStart)
  const cycleAllocations = filterAllocationsInCycle(allocations, cycle)
  const cycleExpenses = filterExpensesInCycle(expenses, cycle, asOfKey)

  return {
    carriedFromAlloc: sumByCategoryId(priorAllocations),
    spentBefore: sumByCategoryId(priorExpenses),
    allocatedByCategory: sumByCategoryId(cycleAllocations),
    spentByCategory: sumByCategoryId(cycleExpenses),
    previousCycleCarryOpening: buildPreviousCycleCarryOpeningByCategory(
      categories,
      allocations,
      expenses,
      cycle,
      closedPeriodMonths,
      incomes,
    ),
  }
}

function resolveCycleOpeningBalance(
  category: BudgetCycleCategory,
  totals: CycleLedgerTotals,
): number {
  if (shouldCarryOpeningInCycle(category)) {
    return (
      (totals.carriedFromAlloc.get(category.id) ?? 0) -
      (totals.spentBefore.get(category.id) ?? 0)
    )
  }

  return totals.previousCycleCarryOpening.get(category.id) ?? 0
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
 * Конверты за активный доходный цикл.
 * Накопления: opening из распределений до цикла.
 * Расходные CARRY: при старте нового цикла — closing предыдущего цикла.
 * Остальные расходные: распределения в цикле − траты в цикле.
 */
export function computeCategoryBudgetsForCycle(
  categories: readonly BudgetCycleCategory[],
  allocations: readonly BudgetCycleAllocation[],
  expenses: readonly BudgetCycleExpense[],
  cycle: ResolvedIncomeCycle,
  asOf: string,
  closedPeriodMonths: ReadonlySet<string> = new Set(),
  incomes: readonly ReceivedIncomeRow[] = [],
  transfers: readonly BudgetCycleTransfer[] = [],
): RebuiltCycleCategoryBudget[] {
  const asOfKey = getCalendarDateKey(asOf)
  if (!asOfKey) {
    return []
  }

  const activeAllocations = filterAllocationsExcludingClosedPeriods(
    mergeTransfersIntoCycleAllocations(allocations, transfers, asOfKey),
    closedPeriodMonths,
  )
  const activeExpenses = filterExpensesExcludingClosedPeriods(
    expenses,
    closedPeriodMonths,
  )

  const totals = prepareCycleLedgerTotals(
    categories,
    activeAllocations,
    activeExpenses,
    cycle,
    asOfKey,
    closedPeriodMonths,
    incomes,
  )

  return categories
    .filter((category) => category.type !== 'income')
    .map((category) => {
      const openingBalance = resolveCycleOpeningBalance(category, totals)
      const allocated = totals.allocatedByCategory.get(category.id) ?? 0
      const rawSpent = totals.spentByCategory.get(category.id) ?? 0
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
  incomes: readonly ReceivedIncomeRow[] = [],
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

  const totals = prepareCycleLedgerTotals(
    categories,
    activeAllocations,
    activeExpenses,
    cycle,
    asOfKey,
    closedPeriodMonths,
    incomes,
  )
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  let total = 0
  for (const expense of filterExpensesInCycle(activeExpenses, cycle, asOfKey)) {
    const category = categoryById.get(expense.category_id)
    if (!category || category.type === 'income') {
      continue
    }

    const openingBalance = resolveCycleOpeningBalance(category, totals)
    const allocated = totals.allocatedByCategory.get(category.id) ?? 0

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
