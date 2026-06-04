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

type BuildEnvelopeForecastChainInput = {
  months: readonly string[]
  selectedPeriodMonth: string
  incomes: readonly Income[]
  rules: readonly AllocationRule[]
  initialBudgetItems: readonly CategoryBudgetItem[]
}

type CategoryForecastAmounts = Map<
  string,
  { category: Category; amount: number }
>

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

function emptyEnvelopeForecast(): EnvelopeForecast {
  return {
    items: [],
    expectedIncomeCount: 0,
    matchedIncomeCount: 0,
    unmatchedIncomeCount: 0,
    warnings: [],
  }
}

function buildForecastAmountsForMonth({
  periodMonth,
  incomes,
  rules,
}: Pick<
  BuildEnvelopeForecastInput,
  'periodMonth' | 'incomes' | 'rules'
>): Omit<EnvelopeForecast, 'items'> & {
  forecastByCategoryId: CategoryForecastAmounts
} {
  const forecastByCategoryId: CategoryForecastAmounts = new Map()
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

  return {
    expectedIncomeCount,
    matchedIncomeCount,
    unmatchedIncomeCount: expectedIncomeCount - matchedIncomeCount,
    warnings,
    forecastByCategoryId,
  }
}

function buildEnvelopeForecastItems(
  forecastByCategoryId: CategoryForecastAmounts,
  getCurrentRemaining: (categoryId: string) => number,
): EnvelopeForecastItem[] {
  return [...forecastByCategoryId.values()]
    .map(({ category, amount }) => {
      const currentRemaining = getCurrentRemaining(category.id)

      return {
        category,
        currentRemaining,
        forecastAmount: amount,
        projectedRemaining: currentRemaining + amount,
      }
    })
    .sort((a, b) => b.forecastAmount - a.forecastAmount)
}

function buildMonthEnvelopeForecast(
  periodMonth: string,
  incomes: readonly Income[],
  rules: readonly AllocationRule[],
  getCurrentRemaining: (categoryId: string) => number,
): EnvelopeForecast {
  const {
    forecastByCategoryId,
    expectedIncomeCount,
    matchedIncomeCount,
    unmatchedIncomeCount,
    warnings,
  } = buildForecastAmountsForMonth({ periodMonth, incomes, rules })

  return {
    items: buildEnvelopeForecastItems(forecastByCategoryId, getCurrentRemaining),
    expectedIncomeCount,
    matchedIncomeCount,
    unmatchedIncomeCount,
    warnings,
  }
}

export function buildEnvelopeForecast({
  periodMonth,
  incomes,
  rules,
  budgetItems,
}: BuildEnvelopeForecastInput): EnvelopeForecast {
  return buildEnvelopeForecastChain({
    months: [periodMonth],
    selectedPeriodMonth: periodMonth,
    incomes,
    rules,
    initialBudgetItems: budgetItems,
  })
}

export function buildEnvelopeForecastChain({
  months,
  selectedPeriodMonth,
  incomes,
  rules,
  initialBudgetItems,
}: BuildEnvelopeForecastChainInput): EnvelopeForecast {
  if (months.length === 0 || !months.includes(selectedPeriodMonth)) {
    return emptyEnvelopeForecast()
  }

  const balanceByCategoryId = new Map<
    string,
    { category: Category; remaining: number }
  >(
    initialBudgetItems.map((item) => [
      item.category.id,
      { category: item.category, remaining: item.remaining },
    ]),
  )

  let selectedForecast: EnvelopeForecast | null = null

  for (const month of months) {
    const monthForecast = buildMonthEnvelopeForecast(
      month,
      incomes,
      rules,
      (categoryId) => balanceByCategoryId.get(categoryId)?.remaining ?? 0,
    )

    for (const item of monthForecast.items) {
      balanceByCategoryId.set(item.category.id, {
        category: item.category,
        remaining: item.projectedRemaining,
      })
    }

    if (month === selectedPeriodMonth) {
      selectedForecast = monthForecast
    }
  }

  return selectedForecast ?? emptyEnvelopeForecast()
}
