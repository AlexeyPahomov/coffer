import type { Income } from '@/entities/income/model/types'

import { getIncomePeriodMonth } from './incomePeriodMonth'
import { isReceivedIncome } from './incomeStatus'

/** Поток дохода для экстраполяции: тип + нормализованный источник. */
function recurringStreamKey(income: Income): string {
  const source = (income.source ?? '').trim().toLowerCase()
  return `${income.income_type}::${source}`
}

/** Поток считается повторяющимся, если встречался минимум в стольких месяцах. */
const RECURRING_STREAM_MIN_MONTHS = 2

/**
 * «Типичный месяц» для экстраполяции дохода на будущее.
 *
 * Берём только ПОВТОРЯЮЩИЕСЯ потоки (income_type + source), встречавшиеся
 * минимум в {@link RECURRING_STREAM_MIN_MONTHS} разных месяцах — от каждого
 * все поступления за его последний месяц. Разовые доходы (бонус, возврат,
 * помощь и т.п.) не проецируются как ежемесячные, иначе шаблон раздувается.
 * Источник сохраняется — от него зависит матчинг allocation-rules.
 */
export function resolveRecurringIncomeTemplate(
  incomes: readonly Income[],
): Income[] {
  const monthsByStream = new Map<string, Set<string>>()

  for (const income of incomes) {
    if (!isReceivedIncome(income)) {
      continue
    }

    const key = recurringStreamKey(income)
    const months = monthsByStream.get(key) ?? new Set<string>()
    months.add(getIncomePeriodMonth(income))
    monthsByStream.set(key, months)
  }

  const latestMonthByRecurringStream = new Map<string, string>()

  for (const [key, months] of monthsByStream) {
    if (months.size < RECURRING_STREAM_MIN_MONTHS) {
      continue
    }

    latestMonthByRecurringStream.set(
      key,
      [...months].reduce((latest, month) => (month > latest ? month : latest)),
    )
  }

  return incomes.filter(
    (income) =>
      isReceivedIncome(income) &&
      getIncomePeriodMonth(income) ===
        latestMonthByRecurringStream.get(recurringStreamKey(income)),
  )
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
