import { describe, expect, it } from 'vitest'

import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import type { Category } from '@/entities/category/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

import { buildPlanningForecast } from './buildPlanningForecast'

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

function budgetItem(remaining: number): CategoryBudgetItem {
  return {
    category: EXPENSE_CATEGORY,
    carriedFromPrevious: 0,
    allocated: 0,
    spent: 0,
    remaining,
  }
}

/** План с категорией: списывается с конверта, из пула — нет. */
function categoryPlan(month: string, amount: number): PlannedExpense {
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

describe('buildPlanningForecast — charge перерасхода конвертов в пул', () => {
  it('без перерасхода не трогает пул', () => {
    const forecast = buildPlanningForecast({
      months: ['2026-08', '2026-09'],
      incomes: [],
      plannedExpenses: [],
      rules: [],
      initialAvailable: 1000,
      initialBudgetItems: [budgetItem(200)],
    })

    expect(forecast.months.map((month) => month.liquidityAdjustment)).toEqual([
      0, 0,
    ])
    expect(forecast.months.map((month) => month.projectedFree)).toEqual([
      1000, 1000,
    ])
  })

  it('списывает перерасход конверта из свободного пула в месяце его появления', () => {
    const forecast = buildPlanningForecast({
      months: ['2026-08', '2026-09'],
      incomes: [],
      plannedExpenses: [categoryPlan('2026-09', 500)],
      rules: [],
      initialAvailable: 1000,
      initialBudgetItems: [budgetItem(200)],
    })

    // Август: остаток конверта 200, перерасхода нет → пул 1000.
    expect(forecast.months[0]).toMatchObject({
      liquidityAdjustment: 0,
      projectedFree: 1000,
    })
    // Сентябрь: план 500 при остатке 200 → перерасход −300 списан из пула.
    expect(forecast.months[1]).toMatchObject({
      liquidityAdjustment: -300,
      projectedFree: 700,
    })
  })

  it('не списывает перерасход повторно, пока дефицит переносится', () => {
    const forecast = buildPlanningForecast({
      months: ['2026-08', '2026-09'],
      incomes: [],
      plannedExpenses: [categoryPlan('2026-08', 500)],
      rules: [],
      initialAvailable: 1000,
      initialBudgetItems: [budgetItem(200)],
    })

    // Перерасход −300 списан в августе; в сентябре дефицит тот же → без charge.
    expect(forecast.months[0]).toMatchObject({
      liquidityAdjustment: -300,
      projectedFree: 700,
    })
    expect(forecast.months[1]).toMatchObject({
      liquidityAdjustment: 0,
      projectedFree: 700,
    })
  })
})
