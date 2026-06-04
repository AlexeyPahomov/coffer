import { computeClosing } from '@coffer/shared'

import type { CategoryBudgetItem } from '../model/types'

/** Бюджет конверта с учётом opening balance (лимит до трат). */
export function getEnvelopeBudgetTotal(item: CategoryBudgetItem): number {
  return computeClosing(item.carriedFromPrevious, item.allocated, 0)
}

/** Есть ли у категории лимит конверта (иначе траты идут из свободного пула). */
export function hasEnvelopeLimit(item: CategoryBudgetItem): boolean {
  return getEnvelopeBudgetTotal(item) > 0
}
