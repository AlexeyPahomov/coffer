import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type {
  BudgetCycleAllocation,
  ReceivedIncomeRow,
  RebuiltCycleCategoryBudget,
} from './incomeCycle.js'
import {
  computeCategoryBudgetsForCycle,
  resolveActiveIncomeCycle,
} from './incomeCycle.js'

function alloc(
  row: Omit<BudgetCycleAllocation, 'income_period_month' | 'allocation_period_month'> & {
    income_period_month?: string
    allocation_period_month?: string
  },
): BudgetCycleAllocation {
  const period =
    row.income_period_month ?? row.income_received_at.slice(0, 7)
  return {
    ...row,
    income_period_month: period,
    allocation_period_month: row.allocation_period_month ?? period,
  }
}

const CARRY_EXPENSE_CATEGORIES = [
  { id: 'groceries', type: 'expense', carry_over_policy: 'CARRY' },
  { id: 'pocket', type: 'expense', carry_over_policy: 'CARRY' },
] as const

const JUNE_ADVANCE_CYCLE = {
  incomeId: 'june-advance',
  cycleStart: '2026-06-22',
  cycleEnd: null,
}

function receivedIncome(
  id: string,
  receivedAt: string,
  overrides: Partial<ReceivedIncomeRow> = {},
): ReceivedIncomeRow {
  return {
    id,
    status: 'RECEIVED',
    received_at: `${receivedAt}T10:00:00.000Z`,
    period_month: `${receivedAt.slice(0, 7)}-01`,
    ...overrides,
  }
}

function expense(category_id: string, amount: number, date: string) {
  return { category_id, amount, date }
}

function computeJuneAdvanceBudgets(
  incomes: readonly ReceivedIncomeRow[],
  allocations: readonly BudgetCycleAllocation[],
  expenses: readonly ReturnType<typeof expense>[],
) {
  return computeCategoryBudgetsForCycle(
    CARRY_EXPENSE_CATEGORIES,
    allocations,
    expenses,
    JUNE_ADVANCE_CYCLE,
    '2026-06-22',
    new Set(),
    incomes,
  )
}

type CarryExpectation = {
  opening: number
  allocated?: number
  closing: number
}

function assertCarryIntoJuneAdvance(
  budgets: readonly RebuiltCycleCategoryBudget[],
  groceries: CarryExpectation,
  pocket: CarryExpectation,
) {
  const groceriesRow = budgets.find((row) => row.categoryId === 'groceries')
  const pocketRow = budgets.find((row) => row.categoryId === 'pocket')

  assert.equal(groceriesRow?.openingBalance, groceries.opening)
  if (groceries.allocated != null) {
    assert.equal(groceriesRow?.allocated, groceries.allocated)
  }
  assert.equal(groceriesRow?.closingBalance, groceries.closing)

  assert.equal(pocketRow?.openingBalance, pocket.opening)
  if (pocket.allocated != null) {
    assert.equal(pocketRow?.allocated, pocket.allocated)
  }
  assert.equal(pocketRow?.closingBalance, pocket.closing)
}

const GROCERIES_POCKET_JUNE_ADVANCE_CARRY = {
  groceries: { opening: -1_000, allocated: 70_000, closing: 69_000 },
  pocket: { opening: -4_000, allocated: 10_000, closing: 6_000 },
} as const

describe('resolveActiveIncomeCycle', () => {
  const salaryIncomes = [
    {
      id: 'may-advance',
      status: 'RECEIVED',
      received_at: '2026-05-22T10:00:00.000Z',
      period_month: '2026-05-01',
    },
    {
      id: 'june-settlement',
      status: 'RECEIVED',
      received_at: '2026-06-05T08:00:00.000Z',
      period_month: '2026-06-01',
    },
  ]

  it('uses advance start and next settlement as cycle end', () => {
    const cycle = resolveActiveIncomeCycle(salaryIncomes, '2026-06-04')
    assert.equal(cycle?.incomeId, 'may-advance')
    assert.equal(cycle?.cycleStart, '2026-05-22')
    assert.equal(cycle?.cycleEnd, '2026-06-05')
  })

  it('opens new cycle on settlement day', () => {
    const cycle = resolveActiveIncomeCycle(salaryIncomes, '2026-06-05')
    assert.equal(cycle?.incomeId, 'june-settlement')
    assert.equal(cycle?.cycleStart, '2026-06-05')
    assert.equal(cycle?.cycleEnd, null)
  })

  it('keeps settlement cycle between settlement and next advance', () => {
    const cycle = resolveActiveIncomeCycle(salaryIncomes, '2026-06-19')
    assert.equal(cycle?.incomeId, 'june-settlement')
    assert.equal(cycle?.cycleStart, '2026-06-05')
    assert.equal(cycle?.cycleEnd, null)
  })

  it('starts advance cycle when advance income arrives after settlement', () => {
    const cycle = resolveActiveIncomeCycle(
      [
        ...salaryIncomes,
        {
          id: 'june-advance',
          status: 'RECEIVED',
          received_at: '2026-06-19T10:00:00.000Z',
          period_month: '2026-06-01',
        },
      ],
      '2026-06-19',
    )

    assert.equal(cycle?.incomeId, 'june-advance')
    assert.equal(cycle?.cycleStart, '2026-06-19')
    assert.equal(cycle?.cycleEnd, null)
  })

  it('keeps settlement cycle when only refund arrives before next advance', () => {
    const cycle = resolveActiveIncomeCycle(
      [
        ...salaryIncomes,
        {
          id: 'june-refund',
          status: 'RECEIVED',
          received_at: '2026-06-19T06:57:24.344Z',
          period_month: '2026-06-01',
          income_type: 'refund',
        },
        {
          id: 'june-advance',
          status: 'RECEIVED',
          received_at: '2026-06-22T10:00:00.000Z',
          period_month: '2026-06-01',
          income_type: 'salary',
        },
      ],
      '2026-06-21',
    )

    assert.equal(cycle?.incomeId, 'june-settlement')
    assert.equal(cycle?.cycleStart, '2026-06-05')
    assert.equal(cycle?.cycleEnd, '2026-06-22')
  })

  it('does not split cycle on extra income between advance and settlement', () => {
    const cycle = resolveActiveIncomeCycle(
      [
        {
          id: 'may-settlement',
          status: 'RECEIVED',
          received_at: '2026-05-05T08:00:00.000Z',
          period_month: '2026-05-01',
        },
        {
          id: 'may-advance',
          status: 'RECEIVED',
          received_at: '2026-05-22T10:00:00.000Z',
          period_month: '2026-05-01',
        },
        {
          id: 'may-extra',
          status: 'RECEIVED',
          received_at: '2026-05-25T12:00:00.000Z',
          period_month: '2026-05-01',
        },
        {
          id: 'june-settlement',
          status: 'RECEIVED',
          received_at: '2026-06-05T08:00:00.000Z',
          period_month: '2026-06-01',
        },
      ],
      '2026-06-04',
      [
        alloc({
          category_id: 'groceries',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 72_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-extra',
          income_received_at: '2026-05-25',
          amount: 1_000,
        }),
      ],
    )

    assert.equal(cycle?.cycleStart, '2026-05-22')
    assert.equal(cycle?.cycleEnd, '2026-06-05')
    assert.equal(cycle?.incomeId, 'may-advance')
  })

  it('starts cycle at main advance, not an earlier stray income', () => {
    const allocations = [
      alloc({
        category_id: 'groceries',
        income_id: 'may-21',
        income_received_at: '2026-05-21',
        income_period_month: '2026-04',
        amount: 70_000,
      }),
      alloc({
        category_id: 'groceries',
        income_id: 'may-22',
        income_received_at: '2026-05-22',
        income_period_month: '2026-05',
        amount: 66_000,
      }),
      alloc({
        category_id: 'groceries',
        income_id: 'may-22',
        income_received_at: '2026-05-22',
        income_period_month: '2026-05',
        amount: 5_000,
      }),
      alloc({
        category_id: 'groceries',
        income_id: 'may-25',
        income_received_at: '2026-05-25',
        income_period_month: '2026-05',
        amount: 1_000,
      }),
    ]

    const cycle = resolveActiveIncomeCycle(
      [
        {
          id: 'may-settlement',
          status: 'RECEIVED',
          received_at: '2026-05-05T08:00:00.000Z',
          period_month: '2026-05-01',
        },
        {
          id: 'may-21',
          status: 'RECEIVED',
          received_at: '2026-05-21T08:00:00.000Z',
          period_month: '2026-04-01',
        },
        {
          id: 'may-22',
          status: 'RECEIVED',
          received_at: '2026-05-22T10:00:00.000Z',
          period_month: '2026-05-01',
        },
        {
          id: 'may-25',
          status: 'RECEIVED',
          received_at: '2026-05-25T12:00:00.000Z',
          period_month: '2026-05-01',
        },
        {
          id: 'june-settlement',
          status: 'RECEIVED',
          received_at: '2026-06-05T08:00:00.000Z',
          period_month: '2026-06-01',
        },
      ],
      '2026-06-04',
      allocations,
    )

    assert.equal(cycle?.cycleStart, '2026-05-22')
    assert.equal(cycle?.incomeId, 'may-22')
  })
})

describe('computeCategoryBudgetsForCycle', () => {
  const mayCycle = {
    incomeId: 'may-advance',
    cycleStart: '2026-05-22',
    cycleEnd: '2026-06-05',
  }

  it('keeps May grocery balance through early June spend in same cycle', () => {
    const [groceries] = computeCategoryBudgetsForCycle(
      [{ id: 'groceries', type: 'expense', carry_over_policy: 'RESET' }],
      [
        alloc({
          category_id: 'groceries',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 72_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-extra',
          income_received_at: '2026-05-25',
          amount: 1_000,
        }),
      ],
      [
        { category_id: 'groceries', amount: 34_000, date: '2026-05-30' },
        { category_id: 'groceries', amount: 8_000, date: '2026-06-04' },
      ],
      mayCycle,
      '2026-06-04',
    )

    assert.equal(groceries?.allocated, 73_000)
    assert.equal(groceries?.spent, 42_000)
    assert.equal(groceries?.closingBalance, 31_000)
  })

  it('does not add pre-cycle carry for expense envelopes with CARRY policy', () => {
    const [groceries] = computeCategoryBudgetsForCycle(
      [{ id: 'groceries', type: 'expense', carry_over_policy: 'CARRY' }],
      [
        alloc({
          category_id: 'groceries',
          income_id: 'apr-settlement',
          income_received_at: '2026-04-05',
          income_period_month: '2026-04',
          amount: 38_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 72_000,
        }),
      ],
      [
        { category_id: 'groceries', amount: 34_000, date: '2026-05-30' },
        { category_id: 'groceries', amount: 8_000, date: '2026-06-04' },
      ],
      mayCycle,
      '2026-06-04',
    )

    assert.equal(groceries?.openingBalance, 0)
    assert.equal(groceries?.allocated, 72_000)
    assert.equal(groceries?.spent, 42_000)
    assert.equal(groceries?.closingBalance, 30_000)
  })

  it('matches SQL case: 72k allocated in cycle minus 42k spent', () => {
    const [groceries] = computeCategoryBudgetsForCycle(
      [{ id: 'groceries', type: 'expense', carry_over_policy: 'CARRY' }],
      [
        alloc({
          category_id: 'groceries',
          income_id: 'may-21',
          income_received_at: '2026-05-21',
          income_period_month: '2026-04',
          amount: 70_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-22',
          income_received_at: '2026-05-22',
          income_period_month: '2026-05',
          amount: 66_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-22',
          income_received_at: '2026-05-22',
          income_period_month: '2026-05',
          amount: 5_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-25',
          income_received_at: '2026-05-25',
          income_period_month: '2026-05',
          amount: 1_000,
        }),
      ],
      [
        { category_id: 'groceries', amount: 34_000, date: '2026-05-30' },
        { category_id: 'groceries', amount: 8_000, date: '2026-06-04' },
      ],
      mayCycle,
      '2026-06-04',
    )

    assert.equal(groceries?.allocated, 72_000)
    assert.equal(groceries?.spent, 42_000)
    assert.equal(groceries?.closingBalance, 30_000)
  })

  it('excludes closed April accounting period from active cycle', () => {
    const closedApril = new Set(['2026-04'])

    const [groceries] = computeCategoryBudgetsForCycle(
      [{ id: 'groceries', type: 'expense', carry_over_policy: 'CARRY' }],
      [
        alloc({
          category_id: 'groceries',
          income_id: 'apr-income',
          income_received_at: '2026-05-21',
          income_period_month: '2026-04',
          amount: 70_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-22',
          income_received_at: '2026-05-22',
          income_period_month: '2026-05',
          amount: 66_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-22',
          income_received_at: '2026-05-22',
          income_period_month: '2026-05',
          amount: 5_000,
        }),
      ],
      [
        { category_id: 'groceries', amount: 34_000, date: '2026-05-30' },
        { category_id: 'groceries', amount: 8_000, date: '2026-06-04' },
      ],
      mayCycle,
      '2026-06-04',
      closedApril,
    )

    assert.equal(groceries?.allocated, 71_000)
    assert.equal(groceries?.closingBalance, 29_000)
  })

  it('does not show unallocated category spend as envelope deficit', () => {
    const [travel] = computeCategoryBudgetsForCycle(
      [{ id: 'travel', type: 'expense', carry_over_policy: 'RESET' }],
      [],
      [{ category_id: 'travel', amount: 8_000, date: '2026-05-30' }],
      mayCycle,
      '2026-06-04',
    )

    assert.equal(travel?.allocated, 0)
    assert.equal(travel?.spent, 8_000)
    assert.equal(travel?.closingBalance, 0)
  })

  it('carries CARRY envelope closing balance into settlement cycle', () => {
    const incomes = [
      {
        id: 'may-advance',
        status: 'RECEIVED',
        received_at: '2026-05-22T10:00:00.000Z',
        period_month: '2026-05-01',
      },
      {
        id: 'june-settlement',
        status: 'RECEIVED',
        received_at: '2026-06-05T08:00:00.000Z',
        period_month: '2026-06-01',
      },
    ]

    const allocations = [
      alloc({
        category_id: 'groceries',
        income_id: 'may-advance',
        income_received_at: '2026-05-22',
        amount: 72_000,
      }),
      alloc({
        category_id: 'groceries',
        income_id: 'june-settlement',
        income_received_at: '2026-06-05',
        income_period_month: '2026-06',
        amount: 60_000,
      }),
    ]

    const expenses = [
      { category_id: 'groceries', amount: 34_000, date: '2026-05-30' },
      { category_id: 'groceries', amount: 8_000, date: '2026-06-04' },
      { category_id: 'groceries', amount: 9_500, date: '2026-06-06' },
    ]

    const juneCycle = {
      incomeId: 'june-settlement',
      cycleStart: '2026-06-05',
      cycleEnd: null,
    }

    const [groceries] = computeCategoryBudgetsForCycle(
      [{ id: 'groceries', type: 'expense', carry_over_policy: 'CARRY' }],
      allocations,
      expenses,
      juneCycle,
      '2026-06-06',
      new Set(),
      incomes,
    )

    assert.equal(groceries?.openingBalance, 30_000)
    assert.equal(groceries?.allocated, 60_000)
    assert.equal(groceries?.spent, 9_500)
    assert.equal(groceries?.closingBalance, 80_500)
  })

  it('carries CARRY envelope deficit into next advance cycle', () => {
    const budgets = computeJuneAdvanceBudgets(
      [
        receivedIncome('may-advance', '2026-05-22'),
        receivedIncome('june-advance', '2026-06-22'),
      ],
      [
        alloc({
          category_id: 'groceries',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 72_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 14_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'june-advance',
          income_received_at: '2026-06-22',
          income_period_month: '2026-06',
          amount: 70_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'june-advance',
          income_received_at: '2026-06-22',
          income_period_month: '2026-06',
          amount: 10_000,
        }),
      ],
      [
        expense('groceries', 73_000, '2026-05-30'),
        expense('pocket', 18_000, '2026-06-04'),
      ],
    )

    assertCarryIntoJuneAdvance(
      budgets,
      GROCERIES_POCKET_JUNE_ADVANCE_CARRY.groceries,
      GROCERIES_POCKET_JUNE_ADVANCE_CARRY.pocket,
    )
  })

  it('does not inflate advance carry from settlement surplus in earlier cycle', () => {
    const budgets = computeJuneAdvanceBudgets(
      [
        receivedIncome('apr-settlement', '2026-04-05'),
        receivedIncome('may-advance', '2026-05-22'),
        receivedIncome('june-advance', '2026-06-22'),
      ],
      [
        alloc({
          category_id: 'groceries',
          income_id: 'apr-settlement',
          income_received_at: '2026-04-05',
          income_period_month: '2026-04',
          amount: 40_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'apr-settlement',
          income_received_at: '2026-04-05',
          income_period_month: '2026-04',
          amount: 30_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 72_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 14_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'june-advance',
          income_received_at: '2026-06-22',
          income_period_month: '2026-06',
          amount: 70_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'june-advance',
          income_received_at: '2026-06-22',
          income_period_month: '2026-06',
          amount: 10_000,
        }),
      ],
      [
        expense('groceries', 2_000, '2026-04-20'),
        expense('pocket', 5_000, '2026-04-25'),
        expense('groceries', 73_000, '2026-05-30'),
        expense('pocket', 18_000, '2026-06-04'),
      ],
    )

    assertCarryIntoJuneAdvance(
      budgets,
      { opening: -1_000, closing: 69_000 },
      { opening: -4_000, closing: 6_000 },
    )
  })

  it('carries CARRY envelope deficit from settlement cycle into next advance', () => {
    const budgets = computeJuneAdvanceBudgets(
      [
        receivedIncome('may-advance', '2026-05-22'),
        receivedIncome('june-settlement', '2026-06-05'),
        receivedIncome('june-advance', '2026-06-22'),
      ],
      [
        alloc({
          category_id: 'groceries',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 72_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 14_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'june-settlement',
          income_received_at: '2026-06-05',
          income_period_month: '2026-06',
          amount: 60_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'june-settlement',
          income_received_at: '2026-06-05',
          income_period_month: '2026-06',
          amount: 8_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'june-advance',
          income_received_at: '2026-06-22',
          income_period_month: '2026-06',
          amount: 70_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'june-advance',
          income_received_at: '2026-06-22',
          income_period_month: '2026-06',
          amount: 10_000,
        }),
      ],
      [
        expense('groceries', 72_000, '2026-05-30'),
        expense('pocket', 18_000, '2026-06-04'),
        expense('groceries', 61_000, '2026-06-20'),
        expense('pocket', 8_000, '2026-06-18'),
      ],
    )

    assertCarryIntoJuneAdvance(
      budgets,
      { opening: -1_000, closing: 69_000 },
      { opening: -4_000, closing: 6_000 },
    )
  })

  it('carries spent-minus-opening when settlement had no new envelope limit', () => {
    const budgets = computeJuneAdvanceBudgets(
      [
        receivedIncome('may-advance', '2026-05-22'),
        receivedIncome('june-settlement', '2026-06-05'),
        receivedIncome('june-advance', '2026-06-22', { income_type: 'salary' }),
      ],
      [
        alloc({
          category_id: 'groceries',
          income_id: 'may-advance',
          income_received_at: '2026-05-22',
          amount: 72_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'june-settlement',
          income_received_at: '2026-06-05',
          income_period_month: '2026-06',
          amount: 20_000,
        }),
        alloc({
          category_id: 'groceries',
          income_id: 'june-advance',
          income_received_at: '2026-06-22',
          income_period_month: '2026-06',
          amount: 70_000,
        }),
        alloc({
          category_id: 'pocket',
          income_id: 'june-advance',
          income_received_at: '2026-06-22',
          income_period_month: '2026-06',
          amount: 10_000,
        }),
      ],
      [
        expense('groceries', 34_000, '2026-05-30'),
        expense('groceries', 8_000, '2026-06-04'),
        expense('pocket', 24_000, '2026-06-05'),
        expense('groceries', 29_000, '2026-06-20'),
      ],
    )

    assertCarryIntoJuneAdvance(
      budgets,
      { opening: -1_000, closing: 69_000 },
      { opening: -4_000, closing: 6_000 },
    )
  })
})
