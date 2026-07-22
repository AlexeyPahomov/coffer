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

type PickSavingsSourceOptions = {
  /** Не рассматривать эту категорию как источник. */
  excludeCategoryId?: string
  /** Только с положительным остатком (латание дефицита не берёт из пустого). */
  requirePositive?: boolean
}

/** Накопительный конверт-источник с наибольшим остатком. */
export function pickSavingsSource(
  budgets: readonly CategoryBudgetSnapshot[],
  options: PickSavingsSourceOptions = {},
): CategoryBudgetSnapshot | undefined {
  return budgets
    .filter(
      (row) =>
        isSavingsCategory(row.categoryType) &&
        row.categoryId !== options.excludeCategoryId &&
        (!options.requirePositive || row.remaining > 0),
    )
    .sort((a, b) => b.remaining - a.remaining)[0]
}

/** Лимит конверта = перенос из прошлого периода + распределённое в этом. */
function envelopeLimit(snapshot: CategoryBudgetSnapshot | undefined): number {
  return snapshot ? snapshot.carriedFromPrevious + snapshot.allocated : 0
}

/**
 * Осознанная оплата расхода **целиком** из накоплений (тоггл в форме), в отличие
 * от {@link buildSavingsTransferHint}, латающего лишь дефицит. Источник — конверт
 * с наибольшим остатком без фильтра `remaining > 0` (минус разрешён — оплатить
 * можно даже из выработанного конверта).
 */
export type SavingsFullFunding = {
  savingsCategoryId: string
  /** Полная сумма расхода. */
  amount: number
  /** null = долить в свободный пул (категория без лимита); иначе — перевод в этот конверт. */
  toCategoryId: string | null
}

export function buildSavingsFullFundingTransfer(
  budgets: readonly CategoryBudgetSnapshot[],
  preview: ExpenseBudgetPreview | null,
): SavingsFullFunding | null {
  if (!preview || isSavingsCategory(preview.categoryType)) {
    return null
  }

  const savings = pickSavingsSource(budgets)
  if (!savings) {
    return null
  }

  const target = budgets.find((row) => row.categoryId === preview.categoryId)

  return {
    savingsCategoryId: savings.categoryId,
    amount: preview.amount,
    toCategoryId: envelopeLimit(target) > 0 ? preview.categoryId : null,
  }
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

  const savings = pickSavingsSource(budgets, {
    excludeCategoryId: preview.categoryId,
    requirePositive: true,
  })
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
  if (envelopeLimit(target) === 0 && freePoolAfter < 0) {
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
