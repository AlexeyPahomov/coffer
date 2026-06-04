import type { Allocation } from '@/entities/allocation/model/types'
import { toMoneyNumber } from '@/shared/lib/money'
import { isReceivedIncome } from '@/entities/income/lib/incomeStatus'

import { isAllocationAlignedWithIncome } from './getAllocationPeriodMonthKey'

export function sumAllocatedByIncome(
  allocations: readonly Pick<
    Allocation,
    'income_id' | 'amount' | 'period_month' | 'income'
  >[],
): Map<string, number> {
  const totals = new Map<string, number>()

  for (const row of allocations) {
    if (!isReceivedIncome(row.income)) {
      continue
    }

    if (!isAllocationAlignedWithIncome(row)) {
      continue
    }

    totals.set(
      row.income_id,
      (totals.get(row.income_id) ?? 0) + toMoneyNumber(row.amount),
    )
  }

  return totals
}
