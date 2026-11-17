import { describe, expect, it } from 'vitest'

import type { PlannedEvent } from '@/entities/planned-event/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import type { PlanningOutcomeMonth } from '@/widgets/planning-outcome-forecast'

import { buildPlanningSummary } from './buildPlanningSummary'

function outcomeMonth(
  month: string,
  overrides: Partial<PlanningOutcomeMonth> = {},
): PlanningOutcomeMonth {
  return {
    month,
    label: month,
    income: 100_000,
    projectedFree: 0,
    savingsBalance: 50_000,
    deficit: 0,
    ...overrides,
  }
}

function plan(
  id: string,
  month: string,
  amount: number,
  overrides: Partial<PlannedExpense> = {},
): PlannedExpense {
  return {
    id,
    user_id: 'user-1',
    title: id,
    description: null,
    icon_name: 'gift',
    icon_color: 'blue',
    amount,
    reserved_amount: 0,
    planned_date: `${month}-10`,
    planned_date_end: null,
    status: 'PLANNED',
    category_id: null,
    savings_category_id: null,
    savings_amount: 0,
    event_id: null,
    budget_month_id: month,
    period_month: month,
    created_at: `${month}-01T00:00:00.000Z`,
    updated_at: `${month}-01T00:00:00.000Z`,
    ...overrides,
  }
}

const greece: PlannedEvent = {
  id: 'greece',
  title: 'Греция',
  icon_name: 'plane',
  icon_color: 'blue',
}

const savingsInput = {
  savingsCategoryIds: new Set(['s']),
  initialSavingsBalance: 50_000,
}

describe('buildPlanningSummary', () => {
  const outcomeMonths = [
    outcomeMonth('2027-01'),
    outcomeMonth('2027-02', { deficit: 5_000, savingsBalance: 20_000 }),
  ]

  it('раскладывает планы по источникам: накопления, конверт, пул', () => {
    const summary = buildPlanningSummary({
      outcomeMonths,
      plannedExpenses: [
        plan('a', '2027-01', 50_000, {
          savings_category_id: 's',
          savings_amount: 30_000,
        }),
        plan('b', '2027-01', 10_000, { category_id: 'trip' }),
      ],
      events: [],
      ...savingsInput,
    })

    expect(summary.months[0].sources).toEqual({
      savings: 30_000,
      pool: 20_000,
      envelope: 10_000,
    })
    expect(summary.total).toBe(60_000)
  })

  it('не учитывает проведённые и отменённые планы', () => {
    const summary = buildPlanningSummary({
      outcomeMonths,
      plannedExpenses: [
        plan('done', '2027-01', 40_000, { status: 'COMPLETED' }),
        plan('cancelled', '2027-01', 40_000, { status: 'CANCELLED' }),
        plan('reserved', '2027-01', 7_000, { status: 'RESERVED' }),
      ],
      events: [],
      ...savingsInput,
    })

    expect(summary.total).toBe(7_000)
  })

  it('крупная трата — от 20% среднего месячного дохода', () => {
    const summary = buildPlanningSummary({
      outcomeMonths,
      plannedExpenses: [
        plan('small', '2027-01', 19_999),
        plan('big', '2027-02', 20_000),
      ],
      events: [],
      ...savingsInput,
    })

    expect(summary.bigPlanThreshold).toBe(20_000)
    expect(summary.bigPlans.map((p) => p.id)).toEqual(['big'])
    expect(summary.peakMonth?.month).toBe('2027-02')
  })

  it('отмечает дефицитные месяцы и минимум накоплений', () => {
    const summary = buildPlanningSummary({
      outcomeMonths,
      plannedExpenses: [],
      events: [],
      ...savingsInput,
    })

    expect(summary.deficitMonths.map((m) => m.month)).toEqual(['2027-02'])
    expect(summary.lowestSavingsMonth?.month).toBe('2027-02')
    expect(summary.peakMonth).toBeNull()
  })

  it('событие показывает полную стоимость, даже если часть планов за горизонтом', () => {
    const summary = buildPlanningSummary({
      outcomeMonths,
      plannedExpenses: [
        plan('tickets', '2027-02', 40_000, { event_id: 'greece' }),
        plan('yacht', '2027-09', 180_000, {
          event_id: 'greece',
          planned_date_end: '2027-09-27',
          savings_amount: 120_000,
          savings_category_id: 's',
        }),
      ],
      events: [greece],
      ...savingsInput,
    })

    expect(summary.events).toHaveLength(1)
    expect(summary.events[0]).toMatchObject({
      total: 220_000,
      horizonTotal: 40_000,
      savingsTotal: 120_000,
      from: '2027-02-10',
      to: '2027-09-27',
    })
  })

  it('показывает событие без планов в горизонте, чтобы им можно было управлять', () => {
    const summary = buildPlanningSummary({
      outcomeMonths,
      plannedExpenses: [plan('yacht', '2027-09', 180_000, { event_id: 'greece' })],
      events: [greece, { ...greece, id: 'empty', title: 'Пустое' }],
      ...savingsInput,
    })

    expect(summary.events).toMatchObject([
      { total: 180_000, horizonTotal: 0, from: '2027-09-10' },
      { total: 0, plans: [], from: null, to: null },
    ])
  })

  it('план на savings-конверт целиком идёт из накоплений', () => {
    const summary = buildPlanningSummary({
      outcomeMonths,
      plannedExpenses: [plan('a', '2027-01', 30_000, { category_id: 's' })],
      events: [],
      ...savingsInput,
    })

    expect(summary.sources).toEqual({ savings: 30_000, pool: 0, envelope: 0 })
    expect(summary.planSources.get('a')).toEqual(summary.sources)
  })

  it('не отмечает минимум накоплений, если они только растут', () => {
    const summary = buildPlanningSummary({
      outcomeMonths: [
        outcomeMonth('2027-01', { savingsBalance: 60_000 }),
        outcomeMonth('2027-02', { savingsBalance: 70_000 }),
      ],
      plannedExpenses: [],
      events: [],
      ...savingsInput,
    })

    expect(summary.lowestSavingsMonth).toBeNull()
  })
})
