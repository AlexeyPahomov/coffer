import { describe, expect, it } from 'vitest'

import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

import {
  buildEnvelopeForecastChain,
  buildExpenseOverspendByMonth,
} from './buildEnvelopeForecast'

const EXPENSE_CATEGORY: Category = {
  id: 'cat-food',
  user_id: 'user-1',
  name: 'Еда',
  type: 'expense',
  icon: 'utensils',
  icon_color: 'amber',
  carry_over_policy: 'CARRY',
  created_at: '2026-01-01T00:00:00.000Z',
}

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

/** Правило: фиксированная аллокация в расходный конверт с каждого дохода. */
function fixedRule(amount: string): AllocationRule {
  return {
    id: 'rule-1',
    user_id: 'user-1',
    name: 'На еду',
    trigger_income_type: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    lines: [
      {
        id: 'line-1',
        rule_id: 'rule-1',
        category_id: EXPENSE_CATEGORY.id,
        category: EXPENSE_CATEGORY,
        mode: 'FIXED',
        amount,
        percent: null,
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  }
}

function budgetItem(remaining: number): CategoryBudgetItem {
  return {
    category: EXPENSE_CATEGORY,
    carriedFromPrevious: 0,
    allocated: 0,
    spent: 0,
    remaining,
  }
}

function plan(month: string, amount: number): PlannedExpense {
  return {
    id: `plan-${month}`,
    user_id: 'user-1',
    title: 'Крупная покупка',
    description: null,
    icon_name: 'shopping-cart',
    icon_color: 'blue',
    amount,
    reserved_amount: 0,
    planned_date: `${month}-15`,
    planned_date_end: null,
    status: 'PLANNED',
    category_id: EXPENSE_CATEGORY.id,
    budget_month_id: month,
    period_month: month,
    created_at: `${month}-01T00:00:00.000Z`,
    updated_at: `${month}-01T00:00:00.000Z`,
  }
}

function selectedItem(months: string[], selected: string, extra = {}) {
  const forecast = buildEnvelopeForecastChain({
    months,
    selectedPeriodMonth: selected,
    incomes: months.map((month) => income(month, '1000')),
    rules: [fixedRule('200')],
    initialBudgetItems: [budgetItem(500)],
    ...extra,
  })
  return forecast.items.find((item) => item.category.id === EXPENSE_CATEGORY.id)
}

describe('buildEnvelopeForecastChain — перенос остатка расходного конверта', () => {
  it('за выбранный месяц показывает текущий остаток и аллокацию', () => {
    const item = selectedItem(['2026-08', '2026-09'], '2026-08')

    expect(item).toMatchObject({ currentRemaining: 500, forecastAmount: 200 })
  })

  it('не копит аллокацию при переносе на следующий месяц', () => {
    // Аллокация 200 считается потраченной за месяц → в сентябрь переносится
    // реальный остаток 500, а не 700.
    const item = selectedItem(['2026-08', '2026-09'], '2026-09')

    expect(item).toMatchObject({ currentRemaining: 500, forecastAmount: 200 })
  })

  it('уменьшает перенос на суммы планов месяца', () => {
    const item = selectedItem(['2026-08', '2026-09'], '2026-09', {
      plannedExpenses: [plan('2026-08', 120)],
    })

    // Август: 500 − 120 = 380 переносится в сентябрь.
    expect(item?.currentRemaining).toBe(380)
  })

  it('переносит дефицит в минус, когда планы больше остатка', () => {
    const item = selectedItem(['2026-08', '2026-09'], '2026-09', {
      plannedExpenses: [plan('2026-08', 700)],
    })

    // Август: 500 − 700 = −200.
    expect(item?.currentRemaining).toBe(-200)
  })
})

describe('buildExpenseOverspendByMonth', () => {
  it('без планов перерасхода нет', () => {
    const { baseline, byMonth } = buildExpenseOverspendByMonth({
      months: ['2026-08', '2026-09'],
      initialBudgetItems: [budgetItem(500)],
    })

    expect(baseline).toBe(0)
    expect([...byMonth.values()]).toEqual([0, 0])
  })

  it('план сверх остатка конверта даёт перерасход в своём месяце', () => {
    const { baseline, byMonth } = buildExpenseOverspendByMonth({
      months: ['2026-08', '2026-09'],
      initialBudgetItems: [budgetItem(500)],
      plannedExpenses: [plan('2026-09', 800)],
    })

    expect(baseline).toBe(0)
    expect(byMonth.get('2026-08')).toBe(0)
    expect(byMonth.get('2026-09')).toBe(-300)
  })

  it('дефицит переносится и не исчезает в следующем месяце', () => {
    const { byMonth } = buildExpenseOverspendByMonth({
      months: ['2026-08', '2026-09'],
      initialBudgetItems: [budgetItem(100)],
      plannedExpenses: [plan('2026-08', 300)],
    })

    expect(byMonth.get('2026-08')).toBe(-200)
    expect(byMonth.get('2026-09')).toBe(-200)
  })

  it('текущий отрицательный остаток попадает в baseline', () => {
    const { baseline } = buildExpenseOverspendByMonth({
      months: ['2026-08'],
      initialBudgetItems: [budgetItem(-150)],
    })

    expect(baseline).toBe(-150)
  })
})
