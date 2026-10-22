import type { PeriodLedgerSummary } from '@coffer/shared'
import { describe, expect, it } from 'vitest'

import { computeExpensePageOperationalSummary } from './computeExpensePageOperationalSummary'

describe('computeExpensePageOperationalSummary (cycle envelopes)', () => {
  it('charges the month overspend even when a new cycle started mid-month', () => {
    // Новый цикл начался сегодня — конверты цикла без перерасхода,
    // но перерасход ранее в этом месяце уже съел свободный пул.
    const ledgerSummary: PeriodLedgerSummary = {
      periodMonth: '2026-10',
      openingFreePool: 0,
      savingsReserveBalance: 0,
      incomeTotal: 180_000,
      allocatedTotal: 122_000,
      spentTotal: 147_000,
      freePoolExpenseTotal: 0,
      overspendCharge: -65_000,
      nonEnvelopeSpentByCategoryId: {},
    }

    const summary = computeExpensePageOperationalSummary({
      periodMonth: '2026-10',
      categories: [],
      incomes: [],
      allocations: [],
      expenses: [],
      useCycleEnvelopes: true,
      allBudgetItems: [],
      ledgerSummary,
    })

    expect(summary.available).toBe(-7_000)
  })
})
