import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  computeCategoryBudgetsForPeriod,
  expandTransfersToAllocations,
} from './budgetRebuild.js'
import { computePeriodLedgerSummary } from './periodLedgerSummary.js'

function freePoolOf(summary: {
  openingFreePool: number
  incomeTotal: number
  allocatedTotal: number
  freePoolExpenseTotal: number
  overspendCharge: number
}): number {
  return (
    summary.openingFreePool +
    summary.incomeTotal -
    summary.allocatedTotal -
    summary.freePoolExpenseTotal +
    summary.overspendCharge
  )
}

describe('expandTransfersToAllocations', () => {
  it('splits a transfer into two signed rows summing to zero', () => {
    const rows = expandTransfersToAllocations([
      {
        from_category_id: 'savings',
        to_category_id: 'repair',
        amount: 1_000,
        period_month: '2026-06-01',
      },
    ])

    assert.equal(rows.length, 2)
    assert.equal(
      rows.reduce((sum, row) => sum + Number(row.amount), 0),
      0,
    )

    const from = rows.find((row) => row.category_id === 'savings')
    const to = rows.find((row) => row.category_id === 'repair')
    assert.equal(from?.amount, -1_000)
    assert.equal(to?.amount, 1_000)
    assert.equal(from?.period_month, '2026-06-01')
  })

  it('covers an overspent envelope from savings without changing net position', () => {
    const categories = [
      { id: 'savings', type: 'savings', carry_over_policy: 'RESET' },
      { id: 'repair', type: 'expense', carry_over_policy: 'CARRY' },
    ]
    // Накопления 5000; на ремонт распределено 500, потрачено 1500 → перерасход 1000.
    const allocations = [
      { category_id: 'savings', amount: 5_000, period_month: '2026-06-01' },
      { category_id: 'repair', amount: 500, period_month: '2026-06-01' },
    ]
    const expenses = [{ category_id: 'repair', amount: 1_500, date: '2026-06-10' }]

    const before = computeCategoryBudgetsForPeriod(
      categories,
      allocations,
      expenses,
      '2026-06',
    )
    const netBefore = before.reduce((sum, row) => sum + row.closingBalance, 0)

    const withTransfer = [
      ...allocations,
      ...expandTransfersToAllocations([
        {
          from_category_id: 'savings',
          to_category_id: 'repair',
          amount: 1_000,
          period_month: '2026-06-01',
        },
      ]),
    ]
    const after = computeCategoryBudgetsForPeriod(
      categories,
      withTransfer,
      expenses,
      '2026-06',
    )

    const savingsAfter = after.find((row) => row.categoryId === 'savings')
    const repairAfter = after.find((row) => row.categoryId === 'repair')

    assert.equal(savingsAfter?.closingBalance, 4_000) // 5000 − 1000
    assert.equal(repairAfter?.closingBalance, 0) // перерасход покрыт

    // Деньги переложены, а не созданы: суммарная чистая позиция не изменилась.
    assert.equal(
      after.reduce((sum, row) => sum + row.closingBalance, 0),
      netBefore,
    )
  })

  it('withdrawal to free pool (to=null) lifts the pool and drops savings by the same amount', () => {
    const categories = [
      { id: 'savings', type: 'savings', carry_over_policy: 'RESET' },
      { id: 'misc', type: 'expense', carry_over_policy: 'CARRY' },
    ]
    // Доход 100k; 50k в накопления; 80k свободная трата по конверту без лимита.
    const allocations = [
      { category_id: 'savings', amount: 50_000, period_month: '2026-06-01' },
    ]
    const expenses = [{ category_id: 'misc', amount: 80_000, date: '2026-06-10' }]
    const incomes = [
      { amount: 100_000, period_month: '2026-06-01', status: 'RECEIVED' },
    ]

    const before = computePeriodLedgerSummary({
      categories,
      allocations,
      expenses,
      incomes,
      periodMonth: '2026-06',
    })
    assert.equal(freePoolOf(before), -30_000) // свободный пул в минусе
    assert.equal(before.savingsReserveBalance, 50_000)

    const withdrawal = expandTransfersToAllocations([
      {
        from_category_id: 'savings',
        to_category_id: null,
        amount: 30_000,
        period_month: '2026-06-01',
      },
    ])
    assert.equal(withdrawal.length, 1) // одна знаковая строка, без получателя

    const after = computePeriodLedgerSummary({
      categories,
      allocations: [...allocations, ...withdrawal],
      expenses,
      incomes,
      periodMonth: '2026-06',
    })
    assert.equal(freePoolOf(after), 0) // дефицит покрыт ровно на 30k
    assert.equal(after.savingsReserveBalance, 20_000) // накопления упали на 30k
  })
})
