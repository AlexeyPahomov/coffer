import type { CategoryBudgetItem, CategoryBudgetSnapshot } from '@/entities/budget'
import { hasEnvelopeLimit } from '@/entities/budget/lib/envelope'
import { isSavingsCategory } from '@/entities/category/lib/categoryKind'

export type ReturnToSavingsHint = {
  savingsCategoryId: string
  savingsName: string
  amount: number
}

/** Savings-приёмник: при нескольких выбираем с наибольшим остатком (детерминизм). */
function pickSavingsTarget(
  snapshots: readonly CategoryBudgetSnapshot[],
  excludeCategoryId: string,
): CategoryBudgetSnapshot | undefined {
  return snapshots
    .filter(
      (snapshot) =>
        isSavingsCategory(snapshot.categoryType) &&
        snapshot.categoryId !== excludeCategoryId,
    )
    .sort((a, b) => b.remaining - a.remaining)[0]
}

/**
 * Подсказка «вернуть остаток конверта в накопления» — обратная операция к
 * «покрыть из накоплений». Доступна для расходного конверта с лимитом и
 * положительным остатком, когда есть savings-приёмник. Возвращает весь остаток
 * одним переводом конверт→накопления.
 *
 * Безлимитные конверты исключены: их «профицит» — это свободный пул, а не остаток
 * конверта (и покрытие туда шло переводом в пул, не в конверт).
 */
export function buildReturnToSavingsHint(
  item: CategoryBudgetItem,
  snapshots: readonly CategoryBudgetSnapshot[],
): ReturnToSavingsHint | null {
  if (isSavingsCategory(item.category.type)) {
    return null
  }
  if (item.remaining <= 0 || !hasEnvelopeLimit(item)) {
    return null
  }

  const target = pickSavingsTarget(snapshots, item.category.id)
  if (!target) {
    return null
  }

  return {
    savingsCategoryId: target.categoryId,
    savingsName: target.categoryName,
    amount: item.remaining,
  }
}
