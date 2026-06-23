import { computeClosing } from '@coffer/shared'

import type { CategoryBudgetItem } from '../model/types'

/** Бюджет конверта с учётом opening balance (лимит до трат). */
export function getEnvelopeBudgetTotal(item: CategoryBudgetItem): number {
  const envelopeTotal = computeClosing(
    item.carriedFromPrevious,
    item.allocated,
    0,
  )

  // Дефицит из прошлого цикла не увеличивает «лимит» нового аванса на карточке.
  if (
    item.category.type !== 'savings' &&
    item.allocated > 0 &&
    item.carriedFromPrevious < 0
  ) {
    return item.allocated
  }

  return envelopeTotal
}

/** Есть ли у категории лимит конверта (иначе траты идут из свободного пула). */
export function hasEnvelopeLimit(item: CategoryBudgetItem): boolean {
  return getEnvelopeBudgetTotal(item) > 0
}
