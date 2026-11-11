import { describe, expect, it } from 'vitest'

import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

import { buildPlanningForecast } from './buildPlanningForecast'

function income(month: string, amount: string): Income {
  return {
    id: `inc-${month}`,
    user_id: 'user-1',
    amount,
    source: 'Расчёт',
    income_type: 'salary',
    status: 'EXPECTED',
    period_month: month,
    received_at: null,
    created_at: `${month}-01T00:00:00.000Z`,
  }
}

function poolPlan(month: string, amount: number): PlannedExpense {
  return {
    id: `plan-${month}`,
    user_id: 'user-1',
    title: 'Покупка',
    description: null,
    icon_name: 'shopping-cart',
    icon_color: 'blue',
    amount,
    reserved_amount: 0,
    planned_date: `${month}-15`,
    planned_date_end: null,
    status: 'PLANNED',
    category_id: null,
    savings_category_id: null,
    savings_amount: 0,
    budget_month_id: month,
    period_month: month,
    created_at: `${month}-01T00:00:00.000Z`,
    updated_at: `${month}-01T00:00:00.000Z`,
  }
}

describe('buildPlanningForecast', () => {
  const incomes = [income('2026-12', '25000'), income('2027-01', '25000')]
  const plannedExpenses = [poolPlan('2026-12', 15000)]

  it('месяцы разгона дают opening первого месяца, но не попадают в результат', () => {
    const forecast = buildPlanningForecast({
      months: ['2027-01'],
      leadInMonths: ['2026-12'],
      incomes,
      plannedExpenses,
      rules: [],
      initialAvailable: 6000,
    })

    expect(forecast.months.map((month) => month.month)).toEqual(['2027-01'])
    expect(forecast.months[0]).toMatchObject({
      openingBalance: 16000,
      projectedFree: 41000,
    })
    expect(forecast.metadata.monthCount).toBe(1)
  })

  it('месяц считается одинаково, выбран ли он сам или предыдущий', () => {
    const fromDecember = buildPlanningForecast({
      months: ['2026-12', '2027-01'],
      incomes,
      plannedExpenses,
      rules: [],
      initialAvailable: 6000,
    })
    const fromJanuary = buildPlanningForecast({
      months: ['2027-01'],
      leadInMonths: ['2026-12'],
      incomes,
      plannedExpenses,
      rules: [],
      initialAvailable: 6000,
    })

    expect(fromJanuary.months[0]).toEqual(fromDecember.months[1])
  })

  it('план с долей из накоплений списывает из пула только остаток', () => {
    const forecast = buildPlanningForecast({
      months: ['2026-12'],
      incomes,
      plannedExpenses: [
        {
          ...poolPlan('2026-12', 15000),
          savings_category_id: 'cat-savings',
          savings_amount: 10000,
        },
      ],
      rules: [],
      initialAvailable: 6000,
    })

    expect(forecast.months[0]).toMatchObject({ projectedFree: 26000 })
  })
})
