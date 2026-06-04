import type { Allocation } from '@/entities/allocation/model/types'
import type { Income } from '@/entities/income/model/types'
import { sumAllocatedByIncome } from '@/entities/allocation/lib/sumAllocatedByIncome'
import { toMoneyNumber } from '@/shared/lib/money'
import { isReceivedIncome } from '@/entities/income/lib/incomeStatus'

/** Полученный доход с максимальным свободным остатком для пополнения конверта. */
export function pickIncomeForTopUp(
  incomes: readonly Income[],
  allocations: readonly Allocation[],
  topUpAmount: number,
): { incomeId: string; remaining: number } | null {
  if (topUpAmount <= 0) {
    return null
  }

  const allocatedByIncome = sumAllocatedByIncome(allocations)
  let best: { incomeId: string; remaining: number } | null = null

  for (const income of incomes) {
    if (!isReceivedIncome(income)) {
      continue
    }

    const remaining =
      toMoneyNumber(income.amount) - (allocatedByIncome.get(income.id) ?? 0)
    if (remaining >= topUpAmount) {
      if (!best || remaining > best.remaining) {
        best = { incomeId: income.id, remaining }
      }
    }
  }

  return best
}
