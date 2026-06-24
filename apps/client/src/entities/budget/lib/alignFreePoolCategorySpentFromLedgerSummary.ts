import type { PeriodLedgerSummary } from '@coffer/shared'

import type { CategoryBudgetItem } from '../model/types'

import { hasEnvelopeLimit } from './envelope'

export function alignFreePoolCategorySpentFromLedgerSummary(
  items: readonly CategoryBudgetItem[],
  ledgerSummary: PeriodLedgerSummary,
): CategoryBudgetItem[] {
  const spentByCategoryId = ledgerSummary.nonEnvelopeSpentByCategoryId

  return items.map((item) => {
    if (hasEnvelopeLimit(item)) {
      return item
    }

    const spent = spentByCategoryId[item.category.id] ?? 0
    return spent === item.spent ? item : { ...item, spent }
  })
}
