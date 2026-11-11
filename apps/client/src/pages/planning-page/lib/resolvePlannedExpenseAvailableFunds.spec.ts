import { describe, expect, it } from 'vitest'

import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

import { resolvePlannedExpenseAvailableFunds } from './resolvePlannedExpenseAvailableFunds'

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

function plan(id: string, month: string, amount: number): PlannedExpense {
  return {
    id,
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

const base = {
  anchorMonth: '2026-11',
  horizon: 2,
  incomes: [
    income('2026-11', '10000'),
    income('2026-12', '10000'),
    income('2027-01', '10000'),
    income('2027-02', '10000'),
  ],
  rules: [],
  excludePlanId: null,
  savingsCategoryIds: new Set<string>(),
  initialAvailable: 0,
  initialSavings: 5000,
}

describe('resolvePlannedExpenseAvailableFunds', () => {
  it('ограничивает пул провалом в последующем месяце горизонта', () => {
    // Декабрь: 20000 свободно; январь: 30000 − 25000 = 5000 → больше 5000 в декабре брать нельзя.
    const funds = resolvePlannedExpenseAvailableFunds({
      ...base,
      periodMonth: '2026-12',
      plannedExpenses: [plan('later', '2027-01', 25000)],
    })

    expect(funds).toEqual({ pool: 5000, savings: 5000 })
  })

  it('не учитывает редактируемый план', () => {
    const funds = resolvePlannedExpenseAvailableFunds({
      ...base,
      periodMonth: '2026-12',
      plannedExpenses: [plan('self', '2026-12', 15000)],
      excludePlanId: 'self',
    })

    expect(funds?.pool).toBe(20000)
  })

  it('для месяца раньше якоря подсказки нет', () => {
    const funds = resolvePlannedExpenseAvailableFunds({
      ...base,
      periodMonth: '2026-10',
      plannedExpenses: [],
    })

    expect(funds).toBeNull()
  })
})
