import { describe, expect, it } from 'vitest'

import type { Income } from '@/entities/income/model/types'

import { copyIncomesFromPreviousMonth } from './copyIncomesFromPreviousMonth'

function income(overrides: Partial<Income>): Income {
  return {
    id: 'inc-1',
    user_id: 'user-1',
    amount: '1000',
    source: null,
    income_type: 'salary',
    status: 'RECEIVED',
    period_month: '2026-12-07T00:00:00.000Z',
    received_at: '2026-12-07T00:00:00.000Z',
    created_at: '2026-12-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('copyIncomesFromPreviousMonth', () => {
  it('копирует доходы прошлого месяца как ожидаемые на то же число', () => {
    const copies = copyIncomesFromPreviousMonth(
      [
        income({ id: 'a', source: 'Аванс', amount: '85000', period_month: '2026-12-22T00:00:00.000Z' }),
        income({ id: 'c', source: 'Расчёт', amount: '95000', status: 'EXPECTED', received_at: null }),
        income({ id: 'old', source: 'Расчёт', period_month: '2026-11-06T00:00:00.000Z' }),
      ],
      '2027-01',
    )

    expect(copies).toEqual([
      { amount: 95000, source: 'Расчёт', income_type: 'salary', status: 'EXPECTED', period_month: '2027-01-07' },
      { amount: 85000, source: 'Аванс', income_type: 'salary', status: 'EXPECTED', period_month: '2027-01-22' },
    ])
  })

  it('переносит несуществующее число на последний день месяца', () => {
    const [copy] = copyIncomesFromPreviousMonth(
      [income({ period_month: '2027-01-31T00:00:00.000Z' })],
      '2027-02',
    )

    expect(copy?.period_month).toBe('2027-02-28')
  })

  it('возвращает пустой список, если в прошлом месяце доходов нет', () => {
    expect(
      copyIncomesFromPreviousMonth([income({ period_month: '2026-10-07T00:00:00.000Z' })], '2027-01'),
    ).toEqual([])
  })
})
