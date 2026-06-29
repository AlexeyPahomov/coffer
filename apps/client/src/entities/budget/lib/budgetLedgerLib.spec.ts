import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ALLOCATION_TYPE,
  DEFAULT_CATEGORY_ICON_KEY,
  DEFAULT_ICON_COLOR_KEY,
  DEFAULT_INCOME_TYPE,
  getMonthKeyFromIso,
} from '@coffer/shared'
import type { CarryOverPolicy, CategoryType, IncomeStatus } from '@coffer/shared'

import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'

import type { BudgetLedgerInput } from '../model/budgetLedgerInput'

import { computeOpeningFreePoolForPeriod } from './computeFreePoolCarry'
import { computeSavingsReserveBalance } from './computeSavingsReserveBalance'
import {
  collectPeriodMonthKeys,
  resolveEarliestPeriodMonth,
} from './periodMonthKeys'

let seq = 0
const nextId = (prefix: string) => `${prefix}-${++seq}`

function category(
  id: string,
  type: CategoryType,
  carryOverPolicy: CarryOverPolicy = 'RESET',
): Category {
  return {
    id,
    user_id: 'u1',
    name: id,
    type,
    icon: DEFAULT_CATEGORY_ICON_KEY,
    icon_color: DEFAULT_ICON_COLOR_KEY,
    carry_over_policy: carryOverPolicy,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

function income(
  amount: number,
  month: string,
  status: IncomeStatus = 'RECEIVED',
): Income {
  return {
    id: nextId('inc'),
    user_id: 'u1',
    amount: String(amount),
    source: null,
    income_type: DEFAULT_INCOME_TYPE,
    status,
    period_month: `${month}-01T00:00:00.000Z`,
    received_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

function allocation(cat: Category, inc: Income, amount: number): Allocation {
  const month = getMonthKeyFromIso(inc.period_month) ?? '2026-01'
  return {
    id: nextId('alloc'),
    user_id: 'u1',
    income_id: inc.id,
    category_id: cat.id,
    amount: String(amount),
    type: DEFAULT_ALLOCATION_TYPE,
    period_month: `${month}-01T00:00:00.000Z`,
    created_at: '2026-01-01T00:00:00.000Z',
    category: cat,
    income: inc,
  }
}

function expense(cat: Category, amount: number, date: string): Expense {
  return {
    id: nextId('exp'),
    user_id: 'u1',
    category_id: cat.id,
    amount,
    description: null,
    date: `${date}T00:00:00.000Z`,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

describe('collectPeriodMonthKeys / resolveEarliestPeriodMonth', () => {
  it('collects unique sorted month keys across incomes, allocations and expenses', () => {
    const food = category('food', 'expense')
    const junIncome = income(100_000, '2026-06')
    const aprIncome = income(50_000, '2026-04')

    const incomes = [junIncome]
    const allocations = [allocation(food, aprIncome, 10_000)] // вклад 2026-04
    const expenses = [
      expense(food, 5_000, '2026-05-10'),
      expense(food, 3_000, '2026-06-20'), // дубль месяца дохода
    ]

    expect(collectPeriodMonthKeys(incomes, allocations, expenses)).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
    ])
    expect(resolveEarliestPeriodMonth(incomes, allocations, expenses)).toBe(
      '2026-04',
    )
  })

  it('returns undefined earliest when there are no events', () => {
    expect(resolveEarliestPeriodMonth([], [], [])).toBeUndefined()
  })
})

describe('computeSavingsReserveBalance', () => {
  it('sums received savings allocations minus all savings expenses', () => {
    const save = category('save', 'savings')
    const food = category('food', 'expense')
    const inc = income(200_000, '2026-06')

    const balance = computeSavingsReserveBalance(
      [save, food],
      [
        allocation(save, inc, 30_000),
        allocation(save, inc, 20_000),
        allocation(food, inc, 50_000), // не savings — игнор
      ],
      [
        expense(save, 10_000, '2026-06-10'),
        expense(food, 5_000, '2026-06-12'), // не savings — игнор
      ],
    )

    // 30000 + 20000 распределено − 10000 потрачено
    expect(balance).toBe(40_000)
  })

  it('excludes savings allocations linked to EXPECTED income', () => {
    const save = category('save', 'savings')
    const received = income(100_000, '2026-06', 'RECEIVED')
    const expected = income(100_000, '2026-06', 'EXPECTED')

    const balance = computeSavingsReserveBalance(
      [save],
      [
        allocation(save, received, 30_000),
        allocation(save, expected, 25_000), // привязана к ожидаемому — исключается
      ],
      [expense(save, 5_000, '2026-06-10')],
    )

    expect(balance).toBe(25_000)
  })

  it('floors at 0 when savings spent exceeds received allocations', () => {
    const save = category('save', 'savings')
    const inc = income(100_000, '2026-06')

    const balance = computeSavingsReserveBalance(
      [save],
      [allocation(save, inc, 10_000)],
      [expense(save, 25_000, '2026-06-10')],
    )

    expect(balance).toBe(0)
  })

  it('returns 0 when there are no savings categories', () => {
    const food = category('food', 'expense')
    const inc = income(100_000, '2026-06')

    expect(
      computeSavingsReserveBalance(
        [food],
        [allocation(food, inc, 20_000)],
        [expense(food, 5_000, '2026-06-10')],
      ),
    ).toBe(0)
  })
})

describe('computeOpeningFreePoolForPeriod', () => {
  it('is 0 for the earliest month (nothing carried in)', () => {
    const food = category('food', 'expense')
    const inc = income(100_000, '2026-06')
    const ledger: BudgetLedgerInput = {
      categories: [food],
      incomes: [inc],
      allocations: [allocation(food, inc, 20_000)],
      expenses: [expense(food, 5_000, '2026-06-10')],
    }

    expect(computeOpeningFreePoolForPeriod('2026-06', ledger)).toBe(0)
  })

  it('carries the prior-month free pool into the next month opening', () => {
    const food = category('food', 'expense')
    const inc = income(100_000, '2026-06')
    const ledger: BudgetLedgerInput = {
      categories: [food],
      incomes: [inc],
      allocations: [allocation(food, inc, 20_000)],
      expenses: [expense(food, 5_000, '2026-06-10')],
    }

    // Июнь: 100000 доход − 20000 распределено − 0 свободных трат = 80000.
    expect(computeOpeningFreePoolForPeriod('2026-07', ledger)).toBe(80_000)
  })
})
