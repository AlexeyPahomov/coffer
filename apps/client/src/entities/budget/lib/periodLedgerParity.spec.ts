import { describe, expect, it } from 'vitest'

import {
  computePeriodLedgerSummary,
  toBudgetRebuildCategory,
} from '@coffer/shared'

import type { BudgetLedgerInput } from '../model/budgetLedgerInput'

import {
  allocation,
  category,
  expense,
  income,
} from './budgetLedgerFixtures'
import { buildCategoryBudgets } from './buildCategoryBudgets'
import { computeOpeningFreePoolForPeriod } from './computeFreePoolCarry'
import { computeSavingsReserveBalance } from './computeSavingsReserveBalance'
import {
  computeFreePoolAvailableForPeriod,
  resolvePeriodLedgerTotals,
} from './periodLedgerTotals'

/**
 * Паритет «client == server»: клиентская оркестрация (derive) обязана давать те же
 * числа, что серверный канон `computePeriodLedgerSummary` (projection), на одних и
 * тех же событиях. Дрейфо-опасная часть — клиентские `computeSavingsReserveBalance`
 * / `computeOpeningFreePoolForPeriod` / `resolvePeriodLedgerTotals`, переопределяющие
 * логику shared. Тест ловит расхождение между ними.
 */

type ParityNumbers = {
  incomeTotal: number
  allocatedTotal: number
  spentTotal: number
  savingsReserveBalance: number
  openingFreePool: number
  available: number
}

/** Клиентская оркестрация (как в `computeOperationalSummary` fallback-ветке). */
function clientNumbers(
  ledger: BudgetLedgerInput,
  periodMonth: string,
): ParityNumbers {
  const totals = resolvePeriodLedgerTotals(ledger, periodMonth)
  const openingFreePool = computeOpeningFreePoolForPeriod(periodMonth, ledger)
  const budgetItems = buildCategoryBudgets(
    ledger.categories,
    ledger.allocations,
    ledger.expenses,
    ledger.incomes,
    periodMonth,
  )
  const available = computeFreePoolAvailableForPeriod(
    ledger,
    periodMonth,
    openingFreePool,
    budgetItems,
  )

  return {
    incomeTotal: totals.incomeTotal,
    allocatedTotal: totals.allocatedTotal,
    spentTotal: totals.spentTotal,
    savingsReserveBalance: computeSavingsReserveBalance(
      ledger.categories,
      ledger.allocations,
      ledger.expenses,
    ),
    openingFreePool,
    available,
  }
}

/** Серверный канон: как `BudgetLedgerSummaryService` строит вход для shared. */
function serverNumbers(
  ledger: BudgetLedgerInput,
  periodMonth: string,
): ParityNumbers {
  const summary = computePeriodLedgerSummary({
    categories: ledger.categories.map(toBudgetRebuildCategory),
    // Зеркало серверного `mapReceivedAllocations`: только RECEIVED.
    allocations: ledger.allocations
      .filter((a) => a.income.status === 'RECEIVED')
      .map((a) => ({
        category_id: a.category_id,
        amount: a.amount,
        period_month: a.period_month,
      })),
    expenses: ledger.expenses.map((e) => ({
      category_id: e.category_id,
      amount: e.amount,
      date: e.date,
    })),
    // Доходы любого статуса — received-фильтр внутри shared.
    incomes: ledger.incomes.map((i) => ({
      amount: i.amount,
      period_month: i.period_month,
      status: i.status,
    })),
    periodMonth,
  })

  return {
    incomeTotal: summary.incomeTotal,
    allocatedTotal: summary.allocatedTotal,
    spentTotal: summary.spentTotal,
    savingsReserveBalance: summary.savingsReserveBalance,
    openingFreePool: summary.openingFreePool,
    available:
      summary.openingFreePool +
      summary.incomeTotal -
      summary.allocatedTotal -
      summary.freePoolExpenseTotal +
      summary.overspendCharge,
  }
}

function assertParity(ledger: BudgetLedgerInput, periodMonth: string) {
  expect(clientNumbers(ledger, periodMonth)).toEqual(
    serverNumbers(ledger, periodMonth),
  )
}

describe('client/server period-ledger parity', () => {
  it('single month: income, allocations, expense, savings', () => {
    const food = category('food', 'expense')
    const save = category('save', 'savings')
    const inc = income(100_000, '2026-06')
    const ledger: BudgetLedgerInput = {
      categories: [food, save],
      incomes: [inc],
      allocations: [allocation(food, inc, 20_000), allocation(save, inc, 10_000)],
      expenses: [expense(food, 5_000, '2026-06-10'), expense(save, 3_000, '2026-06-15')],
    }

    assertParity(ledger, '2026-06')
  })

  it('excludes allocations linked to EXPECTED income on both sides', () => {
    const food = category('food', 'expense')
    const received = income(100_000, '2026-06', 'RECEIVED')
    const expected = income(50_000, '2026-06', 'EXPECTED')
    const ledger: BudgetLedgerInput = {
      categories: [food],
      incomes: [received, expected],
      allocations: [
        allocation(food, received, 20_000),
        // Привязана к ожидаемому доходу — обе стороны должны её исключить.
        allocation(food, expected, 30_000),
      ],
      expenses: [expense(food, 8_000, '2026-06-10')],
    }

    assertParity(ledger, '2026-06')
  })

  it('multi-month carry-over of the free pool (CARRY + RESET + savings)', () => {
    const food = category('food', 'expense', 'RESET')
    const fun = category('fun', 'expense', 'CARRY')
    const save = category('save', 'savings')

    const aprIncome = income(100_000, '2026-04')
    const mayIncome = income(80_000, '2026-05')
    const junIncome = income(120_000, '2026-06')

    const ledger: BudgetLedgerInput = {
      categories: [food, fun, save],
      incomes: [aprIncome, mayIncome, junIncome],
      allocations: [
        allocation(food, aprIncome, 20_000),
        allocation(fun, aprIncome, 15_000),
        allocation(save, aprIncome, 10_000),
        allocation(food, mayIncome, 25_000),
        allocation(fun, mayIncome, 5_000),
        allocation(food, junIncome, 30_000),
        allocation(save, junIncome, 20_000),
      ],
      expenses: [
        // food RESET перерасходован в апреле → overspendCharge в свободный пул.
        expense(food, 28_000, '2026-04-12'),
        expense(fun, 10_000, '2026-04-20'),
        expense(save, 4_000, '2026-04-25'),
        expense(food, 15_000, '2026-05-10'),
        // fun CARRY переносит остаток из апреля.
        expense(fun, 8_000, '2026-05-18'),
        expense(food, 12_000, '2026-06-05'),
      ],
    }

    // Каждый месяц цепочки: opening зависит от переноса предыдущих.
    assertParity(ledger, '2026-04')
    assertParity(ledger, '2026-05')
    assertParity(ledger, '2026-06')
    // Месяц без событий после хвоста — перенос всего накопленного пула.
    assertParity(ledger, '2026-07')
  })
})
