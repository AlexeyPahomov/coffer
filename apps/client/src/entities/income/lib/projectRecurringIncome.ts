import type { Income } from '@/entities/income/model/types'
import { toMoneyNumber } from '@/shared/lib/money'

import { getIncomePeriodMonth } from './incomePeriodMonth'
import { isReceivedIncome } from './incomeStatus'

/** Поток дохода для экстраполяции: тип + нормализованный источник. */
function recurringStreamKey(income: Income): string {
  const source = (income.source ?? '').trim().toLowerCase()
  return `${income.income_type}::${source}`
}

/** Поток считается повторяющимся, если встречался минимум в стольких месяцах. */
const RECURRING_STREAM_MIN_MONTHS = 2

/** Скользящее окно (в месяцах появления потока) для медианы прогнозной суммы. */
const RECURRING_MEDIAN_WINDOW_MONTHS = 6

/** Медиана; при чётном числе значений — среднее двух центральных. */
function median(values: readonly number[]): number {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

type StreamAggregate = {
  monthlyTotals: Map<string, number>
  latestMonth: string
  representative: Income
}

/**
 * «Типичный месяц» для экстраполяции дохода на будущее.
 *
 * Берём только ПОВТОРЯЮЩИЕСЯ потоки (income_type + source), встречавшиеся
 * минимум в {@link RECURRING_STREAM_MIN_MONTHS} разных месяцах. Разовые доходы
 * (бонус, возврат, помощь и т.п.) не проецируются как ежемесячные.
 *
 * Прогнозная сумма потока — МЕДИАНА его помесячных сумм по скользящему окну из
 * последних {@link RECURRING_MEDIAN_WINDOW_MONTHS} месяцев (устойчивее к
 * аномальному последнему месяцу, чем «последняя сумма как есть»). Эмитим одну
 * синтетическую запись на поток на базе последнего месяца (сохраняем source /
 * income_type для матчинга allocation-rules), подменив сумму на медиану.
 */
export function resolveRecurringIncomeTemplate(
  incomes: readonly Income[],
): Income[] {
  const byStream = new Map<string, StreamAggregate>()

  for (const income of incomes) {
    if (!isReceivedIncome(income)) {
      continue
    }

    const key = recurringStreamKey(income)
    const month = getIncomePeriodMonth(income)
    const aggregate = byStream.get(key)

    if (!aggregate) {
      byStream.set(key, {
        monthlyTotals: new Map([[month, toMoneyNumber(income.amount)]]),
        latestMonth: month,
        representative: income,
      })
      continue
    }

    aggregate.monthlyTotals.set(
      month,
      (aggregate.monthlyTotals.get(month) ?? 0) + toMoneyNumber(income.amount),
    )
    if (month >= aggregate.latestMonth) {
      aggregate.latestMonth = month
      aggregate.representative = income
    }
  }

  const template: Income[] = []

  for (const { monthlyTotals, representative } of byStream.values()) {
    if (monthlyTotals.size < RECURRING_STREAM_MIN_MONTHS) {
      continue
    }

    const recentTotals = [...monthlyTotals.entries()]
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .slice(0, RECURRING_MEDIAN_WINDOW_MONTHS)
      .map(([, total]) => total)

    template.push({
      ...representative,
      amount: String(Math.round(median(recentTotals) * 100) / 100),
    })
  }

  return template
}

function projectTemplateIncomeToMonth(income: Income, month: string): Income {
  return {
    ...income,
    id: `${income.id}::projected::${month}`,
    period_month: month,
    status: 'EXPECTED',
    received_at: null,
  }
}

/**
 * Доходы прогнозного месяца по правилу «явный EXPECTED → иначе факт»:
 * — если на месяц заведены EXPECTED-доходы, берём их;
 * — иначе для будущих (строго после текущего календарного) месяцев
 *   подставляем повторяющийся «типичный месяц» из истории;
 * — для текущего и прошлых месяцев экстраполяции нет (только факт EXPECTED).
 */
export function projectIncomesForMonth(
  month: string,
  incomes: readonly Income[],
  template: readonly Income[],
  currentCalendarMonth: string,
): Income[] {
  const expected = incomes.filter(
    (income) =>
      income.status === 'EXPECTED' && getIncomePeriodMonth(income) === month,
  )

  if (expected.length > 0 || month <= currentCalendarMonth) {
    return expected
  }

  return template.map((income) => projectTemplateIncomeToMonth(income, month))
}

/**
 * Прогнозные доходы (все со статусом EXPECTED) на переданные месяцы —
 * единый источник и для цепочки пула, и для прогноза конвертов / накоплений.
 */
export function buildProjectedIncomes(
  months: readonly string[],
  incomes: readonly Income[],
  currentCalendarMonth: string,
): Income[] {
  const template = resolveRecurringIncomeTemplate(incomes)

  return months.flatMap((month) =>
    projectIncomesForMonth(month, incomes, template, currentCalendarMonth),
  )
}
