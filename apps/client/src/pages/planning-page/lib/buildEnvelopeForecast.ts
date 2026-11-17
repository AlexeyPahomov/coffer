import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Category } from '@/entities/category/model/types'
import { isSavingsCategory } from '@/entities/category/lib/categoryKind'
import type { Income } from '@/entities/income/model/types'
import { toPlannedExpenseCommitmentRows } from '@/entities/planned-expense/lib/plannedExpenseCommitmentRows'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { toMoneyNumber } from '@/shared/lib/money'
import { sumPlannedCommitmentsByCategoryId } from '@coffer/planning-core'

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

function buildForecastAmountsForMonth({
  periodMonth,
  incomes,
  rules,
}: {
  periodMonth: string
  incomes: readonly Income[]
  rules: readonly AllocationRule[]
}): { forecastByCategoryId: CategoryForecastAmounts } {
  const forecastByCategoryId: CategoryForecastAmounts = new Map()

  for (const income of incomes) {
    if (!isExpectedIncomeInPeriod(income, periodMonth)) {
      continue
    }

    const rule = pickAllocationRuleForIncome(income, rules)
    if (!rule) {
      continue
    }

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

  return { forecastByCategoryId }
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

