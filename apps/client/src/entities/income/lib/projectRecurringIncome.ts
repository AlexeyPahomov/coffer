import type { Income } from '@/entities/income/model/types'

import { getIncomePeriodMonth } from './incomePeriodMonth'
import { isReceivedIncome } from './incomeStatus'

/** Поток дохода для экстраполяции: тип + нормализованный источник. */
function recurringStreamKey(income: Income): string {
  const source = (income.source ?? '').trim().toLowerCase()
  return `${income.income_type}::${source}`
}

/**
 * «Типичный месяц»: все фактические поступления каждого потока
 * (income_type + source) за его последний месяц. Несколько выплат одного
 * потока в этом месяце сохраняются целиком (не схлопываются в одну), чтобы не
 * недооценить доход и корректно применить fixed-amount правила. Источник
 * сохраняется — от него зависит матчинг allocation-rules (аванс / расчёт).
 */
export function resolveRecurringIncomeTemplate(
  incomes: readonly Income[],
): Income[] {
  const latestMonthByStream = new Map<string, string>()

  for (const income of incomes) {
    if (!isReceivedIncome(income)) {
      continue
    }

    const key = recurringStreamKey(income)
    const month = getIncomePeriodMonth(income)
    const previous = latestMonthByStream.get(key)
    if (!previous || month > previous) {
      latestMonthByStream.set(key, month)
    }
  }

  return incomes.filter(
    (income) =>
      isReceivedIncome(income) &&
      getIncomePeriodMonth(income) ===
        latestMonthByStream.get(recurringStreamKey(income)),
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
