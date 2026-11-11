import { getIncomePeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import { filterReceivedIncomes } from '@/entities/income/lib/incomeStatus'
import type { Income } from '@/entities/income/model/types'

/**
 * Месяц, который Бюджет открывает по умолчанию: текущий, если в нём уже есть
 * полученный доход, иначе последний прошедший с доходом, иначе ближайший будущий.
 * Без полученных доходов — текущий.
 */
export function resolveDefaultBudgetPeriodMonth(
  incomes: readonly Income[],
  currentMonth: string,
): string {
  const months = [
    ...new Set(filterReceivedIncomes(incomes).map(getIncomePeriodMonth)),
  ].sort()

  if (months.length === 0 || months.includes(currentMonth)) {
    return currentMonth
  }

  return months.filter((month) => month < currentMonth).at(-1) ?? months[0]
}
