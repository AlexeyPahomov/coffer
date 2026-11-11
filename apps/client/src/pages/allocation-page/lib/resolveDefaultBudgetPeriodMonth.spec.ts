import { describe, expect, it } from 'vitest'

import type { Income } from '@/entities/income/model/types'

import { resolveDefaultBudgetPeriodMonth } from './resolveDefaultBudgetPeriodMonth'

function income(periodMonth: string, overrides: Partial<Income> = {}): Income {
  return {
    id: periodMonth,
    user_id: 'user-1',
    amount: '1000',
    source: null,
    income_type: 'salary',
    status: 'RECEIVED',
    period_month: `${periodMonth}-05T00:00:00.000Z`,
    received_at: `${periodMonth}-05T00:00:00.000Z`,
    created_at: `${periodMonth}-01T00:00:00.000Z`,
    ...overrides,
  }
}

describe('resolveDefaultBudgetPeriodMonth', () => {
  it('текущий месяц, если в нём есть полученный доход', () => {
    expect(
      resolveDefaultBudgetPeriodMonth([income('2026-10'), income('2026-11')], '2026-11'),
    ).toBe('2026-11')
  })

  it('доход текущего месяца ещё не получен — последний прошедший с доходом', () => {
    expect(
      resolveDefaultBudgetPeriodMonth(
        [
          income('2026-09'),
          income('2026-10'),
          income('2026-12', { status: 'EXPECTED', received_at: null }),
        ],
        '2026-12',
      ),
    ).toBe('2026-10')
  })

  it('только будущие доходы — ближайший будущий', () => {
    expect(
      resolveDefaultBudgetPeriodMonth([income('2027-02'), income('2027-01')], '2026-11'),
    ).toBe('2027-01')
  })

  it('без полученных доходов — текущий', () => {
    expect(resolveDefaultBudgetPeriodMonth([], '2026-11')).toBe('2026-11')
  })
})
