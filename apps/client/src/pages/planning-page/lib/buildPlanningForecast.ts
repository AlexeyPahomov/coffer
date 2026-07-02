import {
  buildForecastChain,
  type ForecastChainResult,
} from '@coffer/planning-core'

import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Income } from '@/entities/income/model/types'
import { toPoolCommitmentRows } from '@/entities/planned-expense/lib/plannedExpenseCommitmentRows'
import { groupPlannedExpensesByPeriodMonth } from '@/entities/planned-expense/lib/groupPlannedExpensesByPeriodMonth'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { toMoneyNumber } from '@/shared/lib/money'

import {
  buildExpenseOverspendByMonth,
  sumExpectedEnvelopeAllocationForMonth,
} from './buildEnvelopeForecast'

type BuildPlanningForecastInput = {
  months: readonly string[]
  incomes: readonly Income[]
  plannedExpenses: readonly PlannedExpense[]
  rules: readonly AllocationRule[]
  initialAvailable: number
  /** Стартовые остатки конвертов — для charge перерасхода в свободный пул. */
  initialBudgetItems?: readonly CategoryBudgetItem[]
  /** Расходные категории без остатка (планы по конвертам без активности). */
  expenseCategories?: readonly Category[]
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
  initialBudgetItems = [],
  expenseCategories = [],
}: BuildPlanningForecastInput): ForecastChainResult {
  const expectedIncomeByMonth = sumExpectedIncomeByMonth(incomes)
  const plannedByMonth = groupPlannedExpensesByPeriodMonth(plannedExpenses)

  // Перерасход расходных конвертов (план категории сверх её остатка) фактически
  // финансируется из свободного пула — списываем приращение перерасхода за месяц
  // через liquidityAdjustment. Текущий перерасход (baseline) уже в
  // initialAvailable, поэтому за первый месяц списывается только новый.
  const overspend = buildExpenseOverspendByMonth({
    months,
    initialBudgetItems,
    plannedExpenses,
    expenseCategories,
  })
  let previousOverspend = overspend.baseline

  return buildForecastChain({
    initialOpening: initialAvailable,
    months: months.map((month) => {
      const monthOverspend = overspend.byMonth.get(month) ?? previousOverspend
      const liquidityAdjustment = monthOverspend - previousOverspend
      previousOverspend = monthOverspend

      return {
        month,
        income: expectedIncomeByMonth.get(month) ?? 0,
        expectedEnvelopeAllocation: sumExpectedEnvelopeAllocationForMonth(
          month,
          incomes,
          rules,
        ),
        liquidityAdjustment,
        commitmentRows: toPoolCommitmentRows(plannedByMonth.get(month) ?? []),
      }
    }),
  })
}
