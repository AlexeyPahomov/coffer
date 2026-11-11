import { describe, expect, it } from 'vitest'

import type { Income } from '@/entities/income/model/types'

import { buildBudgetSummary } from './buildBudgetSummary'

function income(overrides: Partial<Income>): Income {
  return {
    id: 'inc-1',
    user_id: 'user-1',
    amount: '1000',
    source: null,
    income_type: 'salary',
    status: 'RECEIVED',
    period_month: '2026-11-05T00:00:00.000Z',
    received_at: '2026-11-05T00:00:00.000Z',
    created_at: '2026-11-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildBudgetSummary', () => {
  it('ожидается — только ещё не полученные; осталось — получено минус распределено', () => {
    const summary = buildBudgetSummary(
      [
        income({ id: 'a', amount: '200000' }),
        income({ id: 'b', amount: '50000' }),
        income({ id: 'c', amount: '50000', status: 'EXPECTED', received_at: null }),
      ],
      200000,
    )

    expect(summary).toEqual({
      expected: 50000,
      expectedCount: 1,
      received: 250000,
      receivedPercent: 83,
      allocated: 200000,
      remaining: 50000,
      allocatedPercent: 80,
      tone: 'partial',
    })
  })

  it('без полученного дохода — нули и тон «пусто»', () => {
    const summary = buildBudgetSummary(
      [income({ amount: '300000', status: 'EXPECTED', received_at: null })],
      0,
    )

    expect(summary).toMatchObject({
      expected: 300000,
      expectedCount: 1,
      received: 0,
      receivedPercent: 0,
      remaining: 0,
      allocatedPercent: 0,
      tone: 'empty',
    })
  })

  it('распределено больше полученного — тон «перерасход» и отрицательный остаток', () => {
    const summary = buildBudgetSummary([income({ amount: '100000' })], 120000)

    expect(summary).toMatchObject({ remaining: -20000, tone: 'over' })
  })

  it('процент полученного не округляется до 100, пока что-то ждёт получения', () => {
    const summary = buildBudgetSummary(
      [
        income({ id: 'a', amount: '199500' }),
        income({ id: 'b', amount: '500', status: 'EXPECTED', received_at: null }),
      ],
      0,
    )

    expect(summary.receivedPercent).toBe(99)
  })
})
