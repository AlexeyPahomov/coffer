import { describe, expect, it } from 'vitest'

import {
  type BudgetEnvelopeLoadingParams,
  isBudgetEnvelopeLoading,
} from './isBudgetEnvelopeLoading'

const LOADED = { isPending: false, data: {} }

function params(
  overrides: Partial<BudgetEnvelopeLoadingParams>,
): BudgetEnvelopeLoadingParams {
  return {
    categoriesQuery: LOADED,
    incomesQuery: LOADED,
    budgetMonthQuery: LOADED,
    trustSnapshots: true,
    hasLedgerSummary: true,
    needsLedgerEvents: false,
    useCycleEnvelopes: false,
    ...overrides,
  }
}

describe('isBudgetEnvelopeLoading', () => {
  it('ждёт сводку, пока вместо неё показан placeholder прошлого месяца', () => {
    expect(
      isBudgetEnvelopeLoading(
        params({
          ledgerSummaryQuery: {
            isPending: false,
            isPlaceholderData: true,
            data: { periodMonth: '2026-10' },
          },
          hasLedgerSummary: false,
        }),
      ),
    ).toBe(true)
  })

  it('не ждёт, когда пришла сводка за выбранный месяц', () => {
    expect(
      isBudgetEnvelopeLoading(
        params({
          ledgerSummaryQuery: {
            isPending: false,
            isPlaceholderData: false,
            data: { periodMonth: '2026-11' },
          },
          hasLedgerSummary: true,
        }),
      ),
    ).toBe(false)
  })

  it('не зависает, если сводка упала с ошибкой', () => {
    expect(
      isBudgetEnvelopeLoading(
        params({
          ledgerSummaryQuery: {
            isPending: false,
            isPlaceholderData: false,
            data: undefined,
          },
          hasLedgerSummary: false,
        }),
      ),
    ).toBe(false)
  })
})
