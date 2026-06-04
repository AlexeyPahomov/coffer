import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Income } from '@/entities/income/model/types'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { toMoneyNumber } from '@/shared/lib/money'

export type EnvelopeForecastItem = {
  category: Category
  currentRemaining: number
  forecastAmount: number
  projectedRemaining: number
}

export type EnvelopeForecastIncomeWarning = {
  incomeId: string
  ruleName: string
  incomeAmount: number
  rawRuleAmount: number
}

export type EnvelopeForecast = {
  items: EnvelopeForecastItem[]
  expectedIncomeCount: number
  matchedIncomeCount: number
  unmatchedIncomeCount: number
  warnings: EnvelopeForecastIncomeWarning[]
}

type BuildEnvelopeForecastInput = {
  periodMonth: string
  incomes: readonly Income[]
  rules: readonly AllocationRule[]
  budgetItems: readonly CategoryBudgetItem[]
}

function isExpectedIncomeInPeriod(income: Income, periodMonth: string): boolean {
  return income.status === 'EXPECTED' && getIncomePeriodMonth(income) === periodMonth
}

function findMatchingRule(
  income: Income,
  rules: readonly AllocationRule[],
): AllocationRule | undefined {
  return rules.find(
    (rule) =>
      rule.is_active &&
      (rule.trigger_income_type == null ||
        rule.trigger_income_type === income.income_type),
  )
}

function lineForecastAmount(
  line: AllocationRule['lines'][number],
  incomeAmount: number,
): number {
  if (line.mode === 'PERCENT') {
    return (incomeAmount * toMoneyNumber(line.percent ?? 0)) / 100
  }

  return toMoneyNumber(line.amount ?? 0)
}

export function buildEnvelopeForecast({
  periodMonth,
  incomes,
  rules,
  budgetItems,
}: BuildEnvelopeForecastInput): EnvelopeForecast {
  const currentByCategoryId = new Map(
    budgetItems.map((item) => [item.category.id, item]),
  )
  const forecastByCategoryId = new Map<
    string,
    { category: Category; amount: number }
  >()
  const warnings: EnvelopeForecastIncomeWarning[] = []
  let expectedIncomeCount = 0
  let matchedIncomeCount = 0

  for (const income of incomes) {
    if (!isExpectedIncomeInPeriod(income, periodMonth)) {
      continue
    }

    expectedIncomeCount += 1
    const rule = findMatchingRule(income, rules)
    if (!rule) {
      continue
    }

    matchedIncomeCount += 1
    const incomeAmount = toMoneyNumber(income.amount)
    const rawLines = rule.lines.map((line) => ({
      line,
      amount: lineForecastAmount(line, incomeAmount),
    }))
    const rawRuleAmount = rawLines.reduce((sum, item) => sum + item.amount, 0)
    const scale =
      rawRuleAmount > incomeAmount && rawRuleAmount > 0
        ? incomeAmount / rawRuleAmount
        : 1

    if (scale < 1) {
      warnings.push({
        incomeId: income.id,
        ruleName: rule.name,
        incomeAmount,
        rawRuleAmount,
      })
    }

    for (const { line, amount } of rawLines) {
      const forecastAmount = amount * scale
      if (forecastAmount <= 0) {
        continue
      }

      const existing = forecastByCategoryId.get(line.category_id)
      forecastByCategoryId.set(line.category_id, {
        category: existing?.category ?? line.category,
        amount: (existing?.amount ?? 0) + forecastAmount,
      })
    }
  }

  const items = [...forecastByCategoryId.values()]
    .map(({ category, amount }) => {
      const currentRemaining = currentByCategoryId.get(category.id)?.remaining ?? 0

      return {
        category,
        currentRemaining,
        forecastAmount: amount,
        projectedRemaining: currentRemaining + amount,
      }
    })
    .sort((a, b) => b.forecastAmount - a.forecastAmount)

  return {
    items,
    expectedIncomeCount,
    matchedIncomeCount,
    unmatchedIncomeCount: expectedIncomeCount - matchedIncomeCount,
    warnings,
  }
}
