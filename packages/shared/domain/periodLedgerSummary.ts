import {
  computeCategoryBudgetsForPeriod,
  computeFreePoolExpensesForPeriod,
  type BudgetRebuildAllocation,
  type BudgetRebuildCategory,
  type BudgetRebuildExpense,
  type RebuiltCategoryBudget,
} from './budgetRebuild.js'
import { computeClosing } from './budget.js'
import { isReceivedIncomeStatus } from './incomeStatus.js'
import {
  buildPeriodMonthRange,
  getMonthKeyFromIso,
  getPreviousPeriodMonth,
  isSamePeriodMonth,
} from './periodMonth.js'
import { sumMoneyAmounts, toMoneyNumber, type MoneyInput } from '../lib/money.js'

export type PeriodLedgerIncome = {
  amount: MoneyInput
  period_month: string
  status: string
}

export type PeriodLedgerSummary = {
  periodMonth: string
  openingFreePool: number
  savingsReserveBalance: number
  incomeTotal: number
  allocatedTotal: number
  spentTotal: number
  freePoolExpenseTotal: number
  overspendCharge: number
  /** Траты без лимита конверта по категориям за месяц (режим цикла). */
  nonEnvelopeSpentByCategoryId: Record<string, number>
}

export type ComputePeriodLedgerSummaryInput = {
  categories: readonly BudgetRebuildCategory[]
  /**
   * КОНТРАКТ: аллокации обязаны быть уже отфильтрованы по статусу дохода RECEIVED
   * до передачи сюда (сервер — `mapReceivedAllocations`, клиент — `filterReceivedAllocations`).
   * В отличие от `incomes`, received-фильтр здесь внутри НЕ применяется.
   */
  allocations: readonly BudgetRebuildAllocation[]
  expenses: readonly BudgetRebuildExpense[]
  /** Доходы любого статуса: received-фильтр применяется внутри (`filterReceivedIncomes`). */
  incomes: readonly PeriodLedgerIncome[]
  periodMonth: string
}

function categoryTypeById(
  categories: readonly BudgetRebuildCategory[],
): Map<string, string> {
  return new Map(categories.map((category) => [category.id, category.type]))
}

function filterReceivedIncomes(
  incomes: readonly PeriodLedgerIncome[],
  periodMonth: string,
): PeriodLedgerIncome[] {
  return incomes.filter(
    (income) =>
      isReceivedIncomeStatus(income.status) &&
      isSamePeriodMonth(income.period_month, periodMonth),
  )
}

function filterAllocationsByPeriod(
  allocations: readonly BudgetRebuildAllocation[],
  periodMonth: string,
): BudgetRebuildAllocation[] {
  return allocations.filter((allocation) => {
    const key =
      getMonthKeyFromIso(allocation.period_month) ??
      (allocation.income_period_month
        ? getMonthKeyFromIso(allocation.income_period_month)
        : undefined)
    return key === periodMonth
  })
}

function filterExpensesByPeriod(
  expenses: readonly BudgetRebuildExpense[],
  periodMonth: string,
): BudgetRebuildExpense[] {
  return expenses.filter((expense) => isSamePeriodMonth(expense.date, periodMonth))
}

function sumAllocationAmounts(
  allocations: readonly BudgetRebuildAllocation[],
): number {
  return sumMoneyAmounts(allocations.map((allocation) => allocation.amount))
}

function resolveEarliestPeriodMonth(
  incomes: readonly PeriodLedgerIncome[],
  allocations: readonly BudgetRebuildAllocation[],
  expenses: readonly BudgetRebuildExpense[],
): string | undefined {
  const keys = new Set<string>()

  for (const income of incomes) {
    const key = getMonthKeyFromIso(income.period_month)
    if (key) {
      keys.add(key)
    }
  }

  for (const allocation of allocations) {
    const key =
      getMonthKeyFromIso(allocation.period_month) ??
      (allocation.income_period_month
        ? getMonthKeyFromIso(allocation.income_period_month)
        : undefined)
    if (key) {
      keys.add(key)
    }
  }

  for (const expense of expenses) {
    const key = getMonthKeyFromIso(expense.date)
    if (key) {
      keys.add(key)
    }
  }

  return [...keys].sort()[0]
}

function getEnvelopeBudgetTotal(
  row: RebuiltCategoryBudget,
  categoryType: string,
): number {
  const envelopeTotal = computeClosing(row.openingBalance, row.allocated, 0)

  if (
    categoryType !== 'savings' &&
    row.allocated > 0 &&
    row.openingBalance < 0
  ) {
    return row.allocated
  }

  return envelopeTotal
}

function hasEnvelopeLimit(
  row: RebuiltCategoryBudget,
  categoryType: string,
): boolean {
  return getEnvelopeBudgetTotal(row, categoryType) > 0
}

function sumExpenseOverspendCharge(
  budgetRows: readonly RebuiltCategoryBudget[],
  categoryTypes: ReadonlyMap<string, string>,
): number {
  return budgetRows
    .filter((row) => categoryTypes.get(row.categoryId) !== 'savings')
    .reduce((sum, row) => sum + Math.min(0, row.closingBalance), 0)
}

function computeFreePoolAvailableForPeriod(
  input: ComputePeriodLedgerSummaryInput,
  periodMonth: string,
  openingFreePool: number,
  budgetRows: readonly RebuiltCategoryBudget[],
): number {
  const periodIncomes = filterReceivedIncomes(input.incomes, periodMonth)
  const periodAllocations = filterAllocationsByPeriod(
    input.allocations,
    periodMonth,
  )
  const periodExpenses = filterExpensesByPeriod(input.expenses, periodMonth)

  const incomeTotal = sumMoneyAmounts(
    periodIncomes.map((income) => income.amount),
  )
  const allocatedTotal = sumAllocationAmounts(periodAllocations)
  const categoryTypes = categoryTypeById(input.categories)

  const freePoolExpenseTotal = computeFreePoolExpensesForPeriod(
    input.categories,
    input.allocations,
    periodExpenses,
    periodMonth,
  )

  const overspendCharge = sumExpenseOverspendCharge(budgetRows, categoryTypes)

  return (
    openingFreePool +
    incomeTotal -
    allocatedTotal -
    freePoolExpenseTotal +
    overspendCharge
  )
}

function computeOpeningFreePoolForPeriod(
  input: ComputePeriodLedgerSummaryInput,
): number {
  const earliest = resolveEarliestPeriodMonth(
    input.incomes,
    input.allocations,
    input.expenses,
  )
  if (!earliest || input.periodMonth <= earliest) {
    return 0
  }

  const rangeEnd = getPreviousPeriodMonth(input.periodMonth)
  if (!rangeEnd || rangeEnd < earliest) {
    return 0
  }

  let balance = 0
  for (const month of buildPeriodMonthRange(earliest, rangeEnd)) {
    const budgetRows = computeCategoryBudgetsForPeriod(
      input.categories,
      input.allocations,
      input.expenses,
      month,
    )
    balance = computeFreePoolAvailableForPeriod(input, month, balance, budgetRows)
  }

  return balance
}

function computeSavingsReserveBalance(
  input: ComputePeriodLedgerSummaryInput,
): number {
  const savingsCategoryIds = new Set(
    input.categories
      .filter((category) => category.type === 'savings')
      .map((category) => category.id),
  )
  if (savingsCategoryIds.size === 0) {
    return 0
  }

  const allocatedTotal = sumAllocationAmounts(
    input.allocations.filter((allocation) =>
      savingsCategoryIds.has(allocation.category_id),
    ),
  )
  const spentTotal = sumMoneyAmounts(
    input.expenses
      .filter((expense) => savingsCategoryIds.has(expense.category_id))
      .map((expense) => expense.amount),
  )

  return Math.max(0, allocatedTotal - spentTotal)
}

function computeNonEnvelopeSpentByCategoryId(
  input: ComputePeriodLedgerSummaryInput,
  budgetRows: readonly RebuiltCategoryBudget[],
): Record<string, number> {
  const categoryTypes = categoryTypeById(input.categories)
  const periodExpenses = filterExpensesByPeriod(
    input.expenses,
    input.periodMonth,
  )
  const result: Record<string, number> = {}

  for (const row of budgetRows) {
    const categoryType = categoryTypes.get(row.categoryId) ?? 'expense'
    if (hasEnvelopeLimit(row, categoryType)) {
      continue
    }

    const spent = sumMoneyAmounts(
      periodExpenses
        .filter((expense) => expense.category_id === row.categoryId)
        .map((expense) => expense.amount),
    )
    if (spent !== 0) {
      result[row.categoryId] = spent
    }
  }

  return result
}

/**
 * Серверный агрегат свободного пула и итогов месяца без полной выгрузки events на клиент.
 *
 * Канон closing-математики: клиент (derive) и сервер (projection) обязаны давать
 * одинаковый результат для одних и тех же событий. Паритет с клиентской оркестрацией
 * закреплён тестом `apps/client/src/entities/budget/lib/periodLedgerParity.spec.ts`.
 *
 * Контракт входа: `allocations` — уже отфильтрованы по RECEIVED (см. тип),
 * `incomes` — любого статуса (фильтруются внутри).
 */
export function computePeriodLedgerSummary(
  input: ComputePeriodLedgerSummaryInput,
): PeriodLedgerSummary {
  const budgetRows = computeCategoryBudgetsForPeriod(
    input.categories,
    input.allocations,
    input.expenses,
    input.periodMonth,
  )
  const openingFreePool = computeOpeningFreePoolForPeriod(input)
  const periodIncomes = filterReceivedIncomes(input.incomes, input.periodMonth)
  const periodAllocations = filterAllocationsByPeriod(
    input.allocations,
    input.periodMonth,
  )
  const periodExpenses = filterExpensesByPeriod(
    input.expenses,
    input.periodMonth,
  )
  const categoryTypes = categoryTypeById(input.categories)

  return {
    periodMonth: input.periodMonth,
    openingFreePool,
    savingsReserveBalance: computeSavingsReserveBalance(input),
    incomeTotal: sumMoneyAmounts(periodIncomes.map((income) => income.amount)),
    allocatedTotal: sumAllocationAmounts(periodAllocations),
    spentTotal: sumMoneyAmounts(
      periodExpenses.map((expense) => toMoneyNumber(expense.amount)),
    ),
    freePoolExpenseTotal: computeFreePoolExpensesForPeriod(
      input.categories,
      input.allocations,
      periodExpenses,
      input.periodMonth,
    ),
    overspendCharge: sumExpenseOverspendCharge(budgetRows, categoryTypes),
    nonEnvelopeSpentByCategoryId: computeNonEnvelopeSpentByCategoryId(
      input,
      budgetRows,
    ),
  }
}
