import {
  buildForecastChain,
  type ForecastChainResult,
} from '@coffer/planning-core'

import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Income } from '@/entities/income/model/types'
import { toPoolCommitmentRows } from '@/entities/planned-expense/lib/plannedExpenseCommitmentRows'
import { groupPlannedExpensesByPeriodMonth } from '@/entities/planned-expense/lib/groupPlannedExpensesByPeriodMonth'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { toMoneyNumber } from '@/shared/lib/money'

import { sumExpectedEnvelopeAllocationForMonth } from './buildEnvelopeForecast'

type BuildPlanningForecastInput = {
  months: readonly string[]
  incomes: readonly Income[]
  plannedExpenses: readonly PlannedExpense[]
  rules: readonly AllocationRule[]
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

export function buildPlanningForecast({
  months,
  incomes,
  plannedExpenses,
  rules,
  initialAvailable,
}: BuildPlanningForecastInput): ForecastChainResult {
  const expectedIncomeByMonth = sumExpectedIncomeByMonth(incomes)
  const plannedByMonth = groupPlannedExpensesByPeriodMonth(plannedExpenses)

  return buildForecastChain({
    initialOpening: initialAvailable,
    months: months.map((month) => ({
      month,
      income: expectedIncomeByMonth.get(month) ?? 0,
      expectedEnvelopeAllocation: sumExpectedEnvelopeAllocationForMonth(
        month,
        incomes,
        rules,
      ),
      commitmentRows: toPoolCommitmentRows(plannedByMonth.get(month) ?? []),
    })),
  })
}
