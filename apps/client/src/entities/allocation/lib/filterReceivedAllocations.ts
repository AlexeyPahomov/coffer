import type { Allocation } from '../model/types'
import { isReceivedIncome } from '@/entities/income/lib/incomeStatus'

export function filterReceivedAllocations<
  T extends Pick<Allocation, 'income'>,
>(allocations: readonly T[]): T[] {
  return allocations.filter((allocation) => isReceivedIncome(allocation.income))
}
