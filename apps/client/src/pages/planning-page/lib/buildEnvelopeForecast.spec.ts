import { describe, expect, it } from 'vitest'

import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

import { buildProjectedIncomes } from '@/entities/income/lib/projectRecurringIncome'

import { buildEnvelopeForecastChain } from './buildEnvelopeForecast'

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
    savings_category_id: null,
    savings_amount: 0,
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

  it('планы в пределах аллокации месяца не уменьшают перенос', () => {
    const item = selectedItem(['2026-08', '2026-09'], '2026-09', {
      plannedExpenses: [plan('2026-08', 200)],
    })

    // Август: планы 200 покрыты аллокацией 200 → переносится остаток 500.
    expect(item?.currentRemaining).toBe(500)
  })

  it('уменьшает перенос на превышение планов над аллокацией', () => {
    const item = selectedItem(['2026-08', '2026-09'], '2026-09', {
      plannedExpenses: [plan('2026-08', 320)],
    })

    // Август: 500 − (320 − 200) = 380 переносится в сентябрь.
    expect(item?.currentRemaining).toBe(380)
  })

  it('переносит дефицит в минус, когда планы больше остатка и аллокации', () => {
    const item = selectedItem(['2026-08', '2026-09'], '2026-09', {
      plannedExpenses: [plan('2026-08', 900)],
    })

    // Август: 500 − (900 − 200) = −200.
    expect(item?.currentRemaining).toBe(-200)
  })
})

const SAVINGS_CATEGORY: Category = {
  ...EXPENSE_CATEGORY,
  id: 'cat-savings',
  name: 'Накопления',
  type: 'savings',
}

function savingsRule(amount: string): AllocationRule {
  const rule = fixedRule(amount)
  return {
    ...rule,
    lines: rule.lines.map((line) => ({
      ...line,
      category_id: SAVINGS_CATEGORY.id,
      category: SAVINGS_CATEGORY,
    })),
  }
}

function savingsItem(
  months: string[],
  selected: string,
  incomes: Income[],
  extra = {},
) {
  const forecast = buildEnvelopeForecastChain({
    months,
    selectedPeriodMonth: selected,
    incomes,
    rules: [savingsRule('40000')],
    initialBudgetItems: [
      { ...budgetItem(0), category: SAVINGS_CATEGORY },
    ],
    savingsReserveBalance: 10000,
    ...extra,
  })
  return forecast.items.find((item) => item.category.id === SAVINGS_CATEGORY.id)
}

describe('buildEnvelopeForecastChain — savings-конверт', () => {
  const months = ['2026-11', '2026-12', '2027-01']
  // Ноябрьский доход уже получен и сидит в факте 10k; ожидаются декабрь и январь.
  const expectedIncomes = months.slice(1).map((month) => income(month, '100000'))

  it('копит аллокацию по месяцам цепочки', () => {
    const item = savingsItem(months, '2027-01', expectedIncomes)

    // 10k + 40k (декабрь) = 50k на начало января, +40k = 90k.
    expect(item).toMatchObject({
      currentRemaining: 50000,
      forecastAmount: 40000,
      projectedRemaining: 90000,
    })
  })

  it('вычитает планы из накоплений в промежуточных месяцах', () => {
    const item = savingsItem(months, '2027-01', expectedIncomes, {
      plannedExpenses: [
        { ...plan('2026-12', 30000), category_id: SAVINGS_CATEGORY.id },
      ],
    })

    expect(item).toMatchObject({
      currentRemaining: 20000,
      projectedRemaining: 60000,
    })
  })

  it('для текущего месяца «сейчас» — факт накоплений', () => {
    const item = savingsItem(
      months,
      '2026-11',
      months.map((month) => income(month, '100000')),
    )

    expect(item).toMatchObject({
      currentRemaining: 10000,
      projectedRemaining: 50000,
    })
  })

  it('savings-конверт без снапшота стартует с остатка накоплений', () => {
    const item = savingsItem(months, '2027-01', expectedIncomes, {
      initialBudgetItems: [],
    })

    expect(item).toMatchObject({
      currentRemaining: 50000,
      projectedRemaining: 90000,
    })
  })

  it('аллокация будущего месяца без EXPECTED-доходов берётся из шаблона', () => {
    // Повторяющийся доход в двух прошлых месяцах → шаблон для будущих.
    const received = ['2026-09', '2026-10'].map((month) => ({
      ...income(month, '100000'),
      status: 'RECEIVED' as const,
      received_at: `${month}-05T00:00:00.000Z`,
    }))
    const item = savingsItem(
      months,
      '2027-01',
      buildProjectedIncomes(months, received, '2026-11'),
    )

    // Ноябрь (текущий) без EXPECTED — аллокации нет; декабрь и январь — из шаблона.
    expect(item).toMatchObject({
      currentRemaining: 50000,
      forecastAmount: 40000,
      projectedRemaining: 90000,
    })
  })
})
