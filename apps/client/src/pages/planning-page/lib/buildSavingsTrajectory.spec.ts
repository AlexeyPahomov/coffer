import { describe, expect, it } from 'vitest'

import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

import { buildSavingsTrajectory } from './buildSavingsTrajectory'

const SAVINGS_CATEGORY: Category = {
  id: 'cat-savings',
  user_id: 'user-1',
  name: 'Подушка',
  type: 'savings',
  icon: 'wallet',
  icon_color: 'green',
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

function savingsRule(percent: string): AllocationRule {
  return {
    id: 'rule-1',
    user_id: 'user-1',
    name: 'В накопления',
    trigger_income_type: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    lines: [
      {
        id: 'line-1',
        rule_id: 'rule-1',
        category_id: SAVINGS_CATEGORY.id,
        category: SAVINGS_CATEGORY,
        mode: 'PERCENT',
        amount: null,
        percent,
        position: 0,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  }
}

function savingsPlan(month: string, amount: number): PlannedExpense {
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
    category_id: SAVINGS_CATEGORY.id,
    budget_month_id: month,
    period_month: month,
    created_at: `${month}-01T00:00:00.000Z`,
    updated_at: `${month}-01T00:00:00.000Z`,
  }
}

describe('buildSavingsTrajectory', () => {
  it('накапливает аллокацию из правил нарастающим итогом', () => {
    const months = ['2026-08', '2026-09', '2026-10']
    const incomes = months.map((month) => income(month, '1000'))

    const trajectory = buildSavingsTrajectory({
      months,
      incomes,
      rules: [savingsRule('10')],
      plannedExpenses: [],
      savingsCategoryIds: new Set([SAVINGS_CATEGORY.id]),
      initialBalance: 500,
    })

    expect(trajectory.map((point) => point.allocated)).toEqual([100, 100, 100])
    expect(trajectory.map((point) => point.balance)).toEqual([600, 700, 800])
  })

  it('вычитает плановые изъятия из savings', () => {
    const trajectory = buildSavingsTrajectory({
      months: ['2026-08'],
      incomes: [income('2026-08', '1000')],
      rules: [savingsRule('10')],
      plannedExpenses: [savingsPlan('2026-08', 300)],
      savingsCategoryIds: new Set([SAVINGS_CATEGORY.id]),
      initialBalance: 500,
    })

    expect(trajectory[0]).toMatchObject({
      allocated: 100,
      withdrawn: 300,
      balance: 300,
    })
  })

  it('без правил и планов остаётся плоской', () => {
    const trajectory = buildSavingsTrajectory({
      months: ['2026-08', '2026-09'],
      incomes: [income('2026-08', '1000')],
      rules: [],
      plannedExpenses: [],
      savingsCategoryIds: new Set([SAVINGS_CATEGORY.id]),
      initialBalance: 1200,
    })

    expect(trajectory.map((point) => point.balance)).toEqual([1200, 1200])
  })
})
