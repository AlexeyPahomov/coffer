import { isReceivedIncomeStatus } from '@coffer/shared'

import type { Income } from '../model/types'

export function isReceivedIncome(income: Pick<Income, 'status'>): boolean {
  return isReceivedIncomeStatus(income.status)
}

export function filterReceivedIncomes<T extends Pick<Income, 'status'>>(
  incomes: readonly T[],
): T[] {
  return incomes.filter(isReceivedIncome)
}
