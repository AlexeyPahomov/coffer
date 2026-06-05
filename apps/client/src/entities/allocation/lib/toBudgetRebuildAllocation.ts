import type { BudgetRebuildAllocation } from '@coffer/shared'

import type { Allocation } from '../model/types'

import { getAllocationPeriodMonthKey } from './getAllocationPeriodMonthKey'

/** Строка распределения для derive/rebuild с тем же месяцем, что на странице «Бюджет». */
export function toBudgetRebuildAllocation(
  allocation: Pick<Allocation, 'category_id' | 'amount' | 'period_month' | 'income'>,
): BudgetRebuildAllocation {
  const monthKey = getAllocationPeriodMonthKey(allocation)

  return {
    category_id: allocation.category_id,
    amount: allocation.amount,
    period_month: monthKey ? `${monthKey}-01` : allocation.period_month,
    income_period_month: allocation.income.period_month,
  }
}
