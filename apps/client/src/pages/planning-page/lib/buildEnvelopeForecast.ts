import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { CategoryBudgetItem } from '@/entities/budget/model/types'
import type { Category } from '@/entities/category/model/types'
import { isSavingsCategory } from '@/entities/category/lib/categoryKind'
import type { Income } from '@/entities/income/model/types'
import { toPlannedExpenseCommitmentRows } from '@/entities/planned-expense/lib/plannedExpenseCommitmentRows'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { toMoneyNumber } from '@/shared/lib/money'
import { sumPlannedCommitmentsByCategoryId } from '@coffer/planning-core'

export type EnvelopeForecastItem = {
  category: Category
  currentRemaining: number
  forecastAmount: number
  /** Сумма планов с этой категорией за месяц. */
  plannedAmount: number
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
  /** Полный остаток накоплений (все распределения − все траты), для поля «сейчас». */
  savingsReserveBalance?: number
  plannedExpenses?: readonly PlannedExpense[]
  /** Все категории расходов — для планов по конвертам без остатка. */
  expenseCategories?: readonly Category[]
}

type CategoryForecastAmounts = Map<
  string,
  { category: Category; amount: number }
>

function isExpectedIncomeInPeriod(income: Income, periodMonth: string): boolean {
  return income.status === 'EXPECTED' && getIncomePeriodMonth(income) === periodMonth
}

function isRuleMatchingIncome(
  income: Income,
  rule: AllocationRule,
): boolean {
  return (
    rule.is_active &&
    (rule.trigger_income_type == null ||
      rule.trigger_income_type === income.income_type)
  )
}

function findMatchingRules(
  income: Income,
  rules: readonly AllocationRule[],
): AllocationRule[] {
  return rules.filter((rule) => isRuleMatchingIncome(income, rule))
}

function scoreRuleRelevanceForIncome(
  income: Income,
  rule: AllocationRule,
): number {
  const source = (income.source ?? '').trim().toLowerCase()
  const ruleName = rule.name.trim().toLowerCase()

  if (!source || !ruleName) {
    return 0
  }

  if (ruleName.includes(source)) {
    return 100
  }

  const keyword = ruleName.split(/[\s(]/)[0] ?? ''
  if (keyword.length >= 3 && source.includes(keyword)) {
    return 80
  }

  return 0
}

/** Одно правило на доход: при нескольких совпадениях — по источнику (Аванс / Расчёт). */
function pickAllocationRuleForIncome(
  income: Income,
  rules: readonly AllocationRule[],
): AllocationRule | undefined {
  const matching = findMatchingRules(income, rules)
  if (matching.length === 0) {
    return undefined
  }
  if (matching.length === 1) {
    return matching[0]
  }

  const bestScore = Math.max(
    ...matching.map((rule) => scoreRuleRelevanceForIncome(income, rule)),
  )
  if (bestScore > 0) {
    return matching.find(
      (rule) => scoreRuleRelevanceForIncome(income, rule) === bestScore,
    )
  }

  return (
    matching.find((rule) => rule.trigger_income_type != null) ?? matching[0]
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
    const rule = pickAllocationRuleForIncome(income, rules)
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

/** Сумма прогнозного распределения ожидаемых доходов по конвертам за месяц. */
export function sumExpectedEnvelopeAllocationForMonth(
  periodMonth: string,
  incomes: readonly Income[],
  rules: readonly AllocationRule[],
): number {
  const { forecastByCategoryId } = buildForecastAmountsForMonth({
    periodMonth,
    incomes,
    rules,
  })

  return [...forecastByCategoryId.values()].reduce(
    (sum, item) => sum + item.amount,
    0,
  )
}

/** Сумма прогнозного распределения ожидаемых доходов в savings-конверты за месяц. */
export function sumSavingsAllocationForMonth(
  periodMonth: string,
  incomes: readonly Income[],
  rules: readonly AllocationRule[],
): number {
  const { forecastByCategoryId } = buildForecastAmountsForMonth({
    periodMonth,
    incomes,
    rules,
  })

  return [...forecastByCategoryId.values()]
    .filter((item) => isSavingsCategory(item.category.type))
    .reduce((sum, item) => sum + item.amount, 0)
}

function resolveEnvelopeRemaining(
  item: CategoryBudgetItem,
  savingsReserveBalance: number | undefined,
): number {
  if (
    savingsReserveBalance != null &&
    isSavingsCategory(item.category.type)
  ) {
    return savingsReserveBalance
  }

  return item.remaining
}

function applySavingsReserveDisplay(
  forecast: EnvelopeForecast,
  savingsReserveBalance: number | undefined,
): EnvelopeForecast {
  if (savingsReserveBalance == null) {
    return forecast
  }

  return {
    ...forecast,
    items: forecast.items.map((item) => {
      if (!isSavingsCategory(item.category.type)) {
        return item
      }

      return {
        ...item,
        currentRemaining: savingsReserveBalance,
        projectedRemaining:
          savingsReserveBalance + item.forecastAmount - item.plannedAmount,
      }
    }),
  }
}

function resolveSavingsProjectedRemaining(
  item: EnvelopeForecastItem,
  savingsReserveBalance: number | undefined,
): number {
  if (
    savingsReserveBalance != null &&
    isSavingsCategory(item.category.type)
  ) {
    return (
      savingsReserveBalance + item.forecastAmount - item.plannedAmount
    )
  }

  return item.projectedRemaining
}

function buildEnvelopeForecastItems(
  forecastByCategoryId: CategoryForecastAmounts,
  getCurrentRemaining: (categoryId: string) => number,
  plannedByCategoryId: Map<string, number>,
  categoriesById: Map<string, Category>,
): EnvelopeForecastItem[] {
  const categoryIds = new Set([
    ...forecastByCategoryId.keys(),
    ...plannedByCategoryId.keys(),
  ])

  return [...categoryIds]
    .map((categoryId) => {
      const forecastEntry = forecastByCategoryId.get(categoryId)
      const category =
        forecastEntry?.category ?? categoriesById.get(categoryId)
      if (!category) {
        return null
      }

      const currentRemaining = getCurrentRemaining(categoryId)
      const forecastAmount = forecastEntry?.amount ?? 0
      const plannedAmount = plannedByCategoryId.get(categoryId) ?? 0

      // В следующий период переносится реальный остаток конверта.
      // Расходный конверт: аллокация месяца считается потраченной (базовое
      // потребление = аллокация, ADR 003), поэтому в перенос она НЕ копится —
      // остаётся только текущий остаток за вычетом планов (профицит/дефицит).
      // Savings-конверт копит аллокацию как накопление.
      const projectedRemaining = isSavingsCategory(category.type)
        ? currentRemaining + forecastAmount - plannedAmount
        : currentRemaining - plannedAmount

      return {
        category,
        currentRemaining,
        forecastAmount,
        plannedAmount,
        projectedRemaining,
      }
    })
    .filter((item): item is EnvelopeForecastItem => item != null)
    .sort((a, b) => {
      const aIsSavings = isSavingsCategory(a.category.type)
      const bIsSavings = isSavingsCategory(b.category.type)
      if (aIsSavings !== bIsSavings) {
        return aIsSavings ? 1 : -1
      }
      const aTotal = a.forecastAmount + a.plannedAmount
      const bTotal = b.forecastAmount + b.plannedAmount
      return bTotal - aTotal
    })
}

function buildMonthEnvelopeForecast(
  periodMonth: string,
  incomes: readonly Income[],
  rules: readonly AllocationRule[],
  getCurrentRemaining: (categoryId: string) => number,
  plannedByCategoryId: Map<string, number>,
  categoriesById: Map<string, Category>,
): EnvelopeForecast {
  const {
    forecastByCategoryId,
    expectedIncomeCount,
    matchedIncomeCount,
    unmatchedIncomeCount,
    warnings,
  } = buildForecastAmountsForMonth({ periodMonth, incomes, rules })

  return {
    items: buildEnvelopeForecastItems(
      forecastByCategoryId,
      getCurrentRemaining,
      plannedByCategoryId,
      categoriesById,
    ),
    expectedIncomeCount,
    matchedIncomeCount,
    unmatchedIncomeCount,
    warnings,
  }
}

export function plannedCommitmentsForMonth(
  plannedExpenses: readonly PlannedExpense[],
  periodMonth: string,
): Map<string, number> {
  const monthPlans = plannedExpenses.filter(
    (item) => item.period_month === periodMonth,
  )

  return sumPlannedCommitmentsByCategoryId(
    toPlannedExpenseCommitmentRows(monthPlans),
  )
}

type BuildExpenseOverspendInput = {
  months: readonly string[]
  initialBudgetItems: readonly CategoryBudgetItem[]
  plannedExpenses?: readonly PlannedExpense[]
  expenseCategories?: readonly Category[]
}

/**
 * Помесячный перерасход расходных конвертов для charge в свободный пул.
 *
 * Модель как в {@link buildEnvelopeForecastChain}: аллокация расходного конверта
 * считается потреблённой (не копится), поэтому остаток = стартовый − накопленные
 * планы категории. Перерасход месяца = сумма отрицательных остатков расходных
 * конвертов на конец месяца (≤ 0). `baseline` — текущий перерасход до прогноза
 * (уже учтён в свободном пуле), от него считается приращение по месяцам.
 */
export function buildExpenseOverspendByMonth({
  months,
  initialBudgetItems,
  plannedExpenses = [],
  expenseCategories = [],
}: BuildExpenseOverspendInput): {
  baseline: number
  byMonth: Map<string, number>
} {
  const expenseCategoryIds = new Set<string>()
  const remainingByCategoryId = new Map<string, number>()

  for (const item of initialBudgetItems) {
    if (isSavingsCategory(item.category.type)) {
      continue
    }
    expenseCategoryIds.add(item.category.id)
    remainingByCategoryId.set(item.category.id, item.remaining)
  }
  for (const category of expenseCategories) {
    if (isSavingsCategory(category.type)) {
      continue
    }
    expenseCategoryIds.add(category.id)
    if (!remainingByCategoryId.has(category.id)) {
      remainingByCategoryId.set(category.id, 0)
    }
  }

  const sumOverspend = () =>
    [...remainingByCategoryId.values()].reduce(
      (sum, remaining) => sum + Math.min(0, remaining),
      0,
    )

  const baseline = sumOverspend()
  const byMonth = new Map<string, number>()

  for (const month of months) {
    const plannedByCategoryId = plannedCommitmentsForMonth(plannedExpenses, month)
    for (const [categoryId, amount] of plannedByCategoryId) {
      if (!expenseCategoryIds.has(categoryId)) {
        continue
      }
      remainingByCategoryId.set(
        categoryId,
        (remainingByCategoryId.get(categoryId) ?? 0) - amount,
      )
    }
    byMonth.set(month, sumOverspend())
  }

  return { baseline, byMonth }
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
  savingsReserveBalance,
  plannedExpenses = [],
  expenseCategories = [],
}: BuildEnvelopeForecastChainInput): EnvelopeForecast {
  if (months.length === 0 || !months.includes(selectedPeriodMonth)) {
    return emptyEnvelopeForecast()
  }

  const categoriesById = new Map<string, Category>([
    ...initialBudgetItems.map((item) => [item.category.id, item.category] as const),
    ...expenseCategories.map((category) => [category.id, category] as const),
  ])

  const balanceByCategoryId = new Map<
    string,
    { category: Category; remaining: number }
  >(
    initialBudgetItems.map((item) => [
      item.category.id,
      {
        category: item.category,
        remaining: resolveEnvelopeRemaining(item, savingsReserveBalance),
      },
    ]),
  )

  let selectedForecast: EnvelopeForecast | null = null

  for (const month of months) {
    const plannedByCategoryId = plannedCommitmentsForMonth(
      plannedExpenses,
      month,
    )
    const monthForecast = buildMonthEnvelopeForecast(
      month,
      incomes,
      rules,
      (categoryId) => balanceByCategoryId.get(categoryId)?.remaining ?? 0,
      plannedByCategoryId,
      categoriesById,
    )

    for (const item of monthForecast.items) {
      balanceByCategoryId.set(item.category.id, {
        category: item.category,
        remaining: resolveSavingsProjectedRemaining(
          item,
          savingsReserveBalance,
        ),
      })
    }

    if (month === selectedPeriodMonth) {
      selectedForecast = applySavingsReserveDisplay(
        monthForecast,
        savingsReserveBalance,
      )
    }
  }

  return selectedForecast ?? emptyEnvelopeForecast()
}
