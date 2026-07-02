import { describe, expect, it } from 'vitest'

import type { Income } from '@/entities/income/model/types'

import {
  buildProjectedIncomes,
  projectIncomesForMonth,
  resolveRecurringIncomeTemplate,
} from './projectRecurringIncome'

function income(overrides: Partial<Income>): Income {
  return {
    id: 'inc-1',
    user_id: 'user-1',
    amount: '1000',
    source: null,
    income_type: 'salary',
    status: 'RECEIVED',
    period_month: '2026-05',
    received_at: '2026-05-10T00:00:00.000Z',
    created_at: '2026-05-10T00:00:00.000Z',
    ...overrides,
  }
}

describe('resolveRecurringIncomeTemplate', () => {
  it('берёт последний месяц по каждому повторяющемуся потоку', () => {
    const template = resolveRecurringIncomeTemplate([
      income({ id: 'a0', source: 'Аванс', period_month: '2026-04', amount: '400' }),
      income({ id: 'a', source: 'Аванс', period_month: '2026-06', amount: '450' }),
      income({ id: 'c0', source: 'Расчёт', period_month: '2026-05', amount: '800' }),
      income({ id: 'c', source: 'Расчёт', period_month: '2026-06', amount: '900' }),
    ])

    expect(template).toHaveLength(2)
    expect(template.find((i) => i.source === 'Аванс')?.id).toBe('a')
    expect(template.find((i) => i.source === 'Расчёт')?.id).toBe('c')
  })

  it('исключает разовые потоки (встречались только в одном месяце)', () => {
    const template = resolveRecurringIncomeTemplate([
      income({ id: 'salary-may', source: 'Расчёт', period_month: '2026-05', amount: '70000' }),
      income({ id: 'salary-jun', source: 'Расчёт', period_month: '2026-06', amount: '90000' }),
      income({
        id: 'bonus',
        income_type: 'other',
        source: 'Помощь',
        period_month: '2026-06',
        amount: '50000',
      }),
    ])

    expect(template).toHaveLength(1)
    expect(template[0].id).toBe('salary-jun')
  })

  it('сохраняет несколько выплат одного потока за последний месяц', () => {
    const template = resolveRecurringIncomeTemplate([
      income({ id: 'old', source: 'Acme', period_month: '2026-05', amount: '100' }),
      income({ id: 'a', source: 'Acme', period_month: '2026-06', amount: '20000' }),
      income({ id: 'b', source: 'Acme', period_month: '2026-06', amount: '20000' }),
    ])

    expect(template.map((i) => i.id).sort()).toEqual(['a', 'b'])
  })

  it('игнорирует EXPECTED-доходы', () => {
    const template = resolveRecurringIncomeTemplate([
      income({ id: 'a', status: 'EXPECTED', period_month: '2026-07' }),
    ])

    expect(template).toHaveLength(0)
  })
})

describe('projectIncomesForMonth', () => {
  const template = [income({ id: 'salary', amount: '1000', source: 'Расчёт' })]

  it('возвращает заведённый EXPECTED, не трогая шаблон', () => {
    const expected = income({
      id: 'planned',
      status: 'EXPECTED',
      period_month: '2026-08',
      amount: '2000',
    })

    const result = projectIncomesForMonth(
      '2026-08',
      [expected],
      template,
      '2026-07',
    )

    expect(result).toEqual([expected])
  })

  it('подставляет шаблон для будущего месяца без EXPECTED', () => {
    const result = projectIncomesForMonth('2026-09', [], template, '2026-07')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      amount: '1000',
      source: 'Расчёт',
      status: 'EXPECTED',
      period_month: '2026-09',
      received_at: null,
    })
    expect(result[0].id).not.toBe('salary')
  })

  it('не экстраполирует текущий и прошлые месяцы', () => {
    expect(projectIncomesForMonth('2026-07', [], template, '2026-07')).toEqual([])
    expect(projectIncomesForMonth('2026-06', [], template, '2026-07')).toEqual([])
  })
})

describe('buildProjectedIncomes', () => {
  it('EXPECTED имеет приоритет, будущие пустые месяцы заполняются фактом', () => {
    const history = [
      income({ id: 'fact-may', amount: '1000', period_month: '2026-05' }),
      income({ id: 'fact-jun', amount: '1000', period_month: '2026-06' }),
      income({
        id: 'expected-aug',
        status: 'EXPECTED',
        amount: '3000',
        period_month: '2026-08',
      }),
    ]

    const result = buildProjectedIncomes(
      ['2026-07', '2026-08', '2026-09'],
      history,
      '2026-07',
    )

    // Июль (текущий) без EXPECTED → пусто; август — заведённый EXPECTED; сентябрь — из факта.
    expect(result.map((i) => i.period_month)).toEqual(['2026-08', '2026-09'])
    expect(result.find((i) => i.period_month === '2026-08')?.amount).toBe('3000')
    expect(result.find((i) => i.period_month === '2026-09')?.amount).toBe('1000')
  })
})
