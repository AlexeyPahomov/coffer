import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { computePeriodLedgerSummary } from './periodLedgerSummary.js'

describe('computePeriodLedgerSummary', () => {
  it('computes month totals and zero opening pool for the first month', () => {
    const summary = computePeriodLedgerSummary({
      categories: [{ id: 'food', type: 'expense', carry_over_policy: 'RESET' }],
      allocations: [
        {
          category_id: 'food',
          amount: 20_000,
          period_month: '2026-06-01T00:00:00.000Z',
        },
      ],
      expenses: [
        {
          category_id: 'food',
          amount: 5_000,
          date: '2026-06-10T00:00:00.000Z',
        },
      ],
      incomes: [
        {
          amount: 100_000,
          period_month: '2026-06-01T00:00:00.000Z',
          status: 'RECEIVED',
        },
      ],
      periodMonth: '2026-06',
    })

    assert.equal(summary.periodMonth, '2026-06')
    assert.equal(summary.openingFreePool, 0)
    assert.equal(summary.incomeTotal, 100_000)
    assert.equal(summary.allocatedTotal, 20_000)
    assert.equal(summary.spentTotal, 5_000)
    assert.equal(summary.savingsReserveBalance, 0)
  })
})
