import type { CategoryBudgetSnapshot } from '@/entities/budget'
import { isSavingsCategory } from '@/entities/category/lib/categoryKind'

import type { ExpenseBudgetPreview } from '../model/budget'

export type SavingsTransferHint = {
  savingsCategoryId: string
  savingsName: string
  available: number
  shortfall: number
  /** null = долить дефицит свободного пула из накоплений; иначе — перевод в этот конверт. */
  toCategoryId: string | null
}

function pickSavingsSource(
  budgets: readonly CategoryBudgetSnapshot[],
  excludeCategoryId: string,
): CategoryBudgetSnapshot | undefined {
  return budgets
    .filter(
      (row) =>
        isSavingsCategory(row.categoryType) &&
        row.categoryId !== excludeCategoryId &&
        row.remaining > 0,
    )
    .sort((a, b) => b.remaining - a.remaining)[0]
}

/**
 * Подсказка «покрыть из накоплений» для двух дефицитов:
 * - перерасход конверта с лимитом → перевод в этот конверт на `overAmount`;
 * - трата из свободных средств уводит пул в минус → долить дефицит в пул (`toCategoryId = null`).
 *
 * `freePoolAfter` — прогноз свободного пула после этой траты (нужен для второго случая).
 */
export function buildSavingsTransferHint(
  budgets: readonly CategoryBudgetSnapshot[],
  preview: ExpenseBudgetPreview | null,
  freePoolAfter: number,
): SavingsTransferHint | null {
  if (!preview || isSavingsCategory(preview.categoryType)) {
    return null
  }

  const savings = pickSavingsSource(budgets, preview.categoryId)
  if (!savings) {
    return null
  }

  // Перерасход конверта с лимитом — покрываем перевод в этот конверт.
  if (preview.isOverBudget) {
    return {
      savingsCategoryId: savings.categoryId,
      savingsName: savings.categoryName,
      available: savings.remaining,
      shortfall: preview.overAmount,
      toCategoryId: preview.categoryId,
    }
  }

  // Трата из свободных средств (конверт без лимита) уводит пул в минус — доливаем дефицит.
  const target = budgets.find((row) => row.categoryId === preview.categoryId)
  const envelopeLimit = target
    ? target.carriedFromPrevious + target.allocated
    : 0
  if (envelopeLimit === 0 && freePoolAfter < 0) {
    return {
      savingsCategoryId: savings.categoryId,
      savingsName: savings.categoryName,
      available: savings.remaining,
      shortfall: -freePoolAfter,
      toCategoryId: null,
    }
  }

  return null
}
