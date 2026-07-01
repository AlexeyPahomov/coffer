import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Income } from '@/entities/income/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'

import {
  plannedCommitmentsForMonth,
  sumSavingsAllocationForMonth,
} from './buildEnvelopeForecast'

export type SavingsTrajectoryPoint = {
  month: string
  /** Аллокация в savings-конверты за месяц (по правилам от прогнозного дохода). */
  allocated: number
  /** Плановые изъятия из savings за месяц. */
  withdrawn: number
  /** Накопления на конец месяца (нарастающим итогом от initialBalance). */
  balance: number
}

type BuildSavingsTrajectoryInput = {
  months: readonly string[]
  incomes: readonly Income[]
  rules: readonly AllocationRule[]
  plannedExpenses: readonly PlannedExpense[]
  savingsCategoryIds: ReadonlySet<string>
  /** Накопления на текущий момент (до первого месяца траектории). */
  initialBalance: number
}

function sumSavingsWithdrawalForMonth(
  plannedExpenses: readonly PlannedExpense[],
  month: string,
  savingsCategoryIds: ReadonlySet<string>,
): number {
  const byCategoryId = plannedCommitmentsForMonth(plannedExpenses, month)

  let total = 0
  for (const [categoryId, amount] of byCategoryId) {
    if (savingsCategoryIds.has(categoryId)) {
      total += amount
    }
  }

  return total
}

/**
 * Помесячная траектория накоплений: суммарный остаток savings-конвертов
 * нарастающим итогом. Каждый месяц: + аллокация из правил − плановые изъятия.
 */
export function buildSavingsTrajectory({
  months,
  incomes,
  rules,
  plannedExpenses,
  savingsCategoryIds,
  initialBalance,
}: BuildSavingsTrajectoryInput): SavingsTrajectoryPoint[] {
  let balance = initialBalance

  return months.map((month) => {
    const allocated = sumSavingsAllocationForMonth(month, incomes, rules)
    const withdrawn = sumSavingsWithdrawalForMonth(
      plannedExpenses,
      month,
      savingsCategoryIds,
    )
    balance = balance + allocated - withdrawn

    return { month, allocated, withdrawn, balance }
  })
}
