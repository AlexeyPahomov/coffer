import { buildForecastChain, type ForecastChainResult } from '@coffer/planning-core'

import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { toMoneyNumber } from '@/shared/lib/money'

type BuildPlanningForecastInput = {
  months: readonly string[]
  incomes: readonly Income[]
  plannedExpenses: readonly PlannedExpense[]
  initialAvailable: number
}

function isExpectedIncome(income: Pick<Income, 'status'>): boolean {
  return income.status === 'EXPECTED'
}

function sumExpectedIncomeByMonth(
  incomes: readonly Income[],
): Map<string, number> {
  const totals = new Map<string, number>()

  for (const income of incomes) {
    if (!isExpectedIncome(income)) {
      continue
    }

    const periodMonth = getIncomePeriodMonth(income)
    totals.set(
      periodMonth,
      (totals.get(periodMonth) ?? 0) + toMoneyNumber(income.amount),
    )
  }

  return totals
}

function groupPlannedExpensesByMonth(
  plannedExpenses: readonly PlannedExpense[],
): Map<string, PlannedExpense[]> {
  const groups = new Map<string, PlannedExpense[]>()

  for (const item of plannedExpenses) {
    const group = groups.get(item.period_month)

    if (group) {
      group.push(item)
      continue
    }

    groups.set(item.period_month, [item])
  }

  return groups
}

export function buildPlanningForecast({
  months,
  incomes,
  plannedExpenses,
  initialAvailable,
}: BuildPlanningForecastInput): ForecastChainResult {
  const expectedIncomeByMonth = sumExpectedIncomeByMonth(incomes)
  const plannedByMonth = groupPlannedExpensesByMonth(plannedExpenses)

  return buildForecastChain({
    initialOpening: initialAvailable,
    months: months.map((month) => ({
      month,
      income: expectedIncomeByMonth.get(month) ?? 0,
      commitmentRows: (plannedByMonth.get(month) ?? []).map((item) => ({
        amount: item.amount,
        reserved_amount: item.reserved_amount,
        status: item.status,
      })),
    })),
  })
}
