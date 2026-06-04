import type { Income } from '@/entities/income/model/types'
import { toMoneyNumber } from '@/shared/lib/money'
import { isReceivedIncome } from '@/entities/income/lib/incomeStatus'

/** Доход с наибольшим нераспределённым остатком. */
export function pickIncomeWithMaxRemaining(
  incomes: readonly Income[],
  allocatedByIncome: Map<string, number>,
): string | null {
  if (incomes.length === 0) {
    return null
  }

  let bestId: string | null = null
  let bestRemaining = -Infinity

  for (const income of incomes) {
    if (!isReceivedIncome(income)) {
      continue
    }

    const remaining =
      toMoneyNumber(income.amount) - (allocatedByIncome.get(income.id) ?? 0)

    if (remaining > bestRemaining) {
      bestRemaining = remaining
      bestId = income.id
    }
  }

  return bestId
}
