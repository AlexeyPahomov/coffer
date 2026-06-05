import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { BudgetCycleAllocation } from './incomeCycle.js'
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
})
