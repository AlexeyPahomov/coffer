/** Состояние конверта категории за месяц (projection). */
export type CategoryMonthSnapshotState = {
  openingBalance: number
  allocated: number
  spent: number
}

export type CategoryMonthSnapshotComputed = CategoryMonthSnapshotState & {
  closingBalance: number
}

/** closing = opening + allocated − spent (единственный способ получить closing). */
export function computeClosing(
  openingBalance: number,
  allocated: number,
  spent: number,
): number {
  return openingBalance + allocated - spent
}

export function bootstrapOpening(
  previousClosing: number | null | undefined,
): number {
  return previousClosing ?? 0
}

export function isOverspent(closingBalance: number): boolean {
  return closingBalance < 0
}

export function applyExpenseDelta(spent: number, amount: number): number {
  return spent + amount
}

export function applyAllocationDelta(allocated: number, amount: number): number {
  return allocated + amount
}

/** Пересчёт closing после изменения opening / allocated / spent. */
export function recomputeSnapshot(
  state: CategoryMonthSnapshotState,
): CategoryMonthSnapshotComputed {
  return {
    ...state,
    closingBalance: computeClosing(
      state.openingBalance,
      state.allocated,
      state.spent,
    ),
  }
}

/** Алиас для UI: remaining = closing. */
export function computeRemaining(
  openingBalance: number,
  allocated: number,
  spent: number,
): number {
  return computeClosing(openingBalance, allocated, spent)
}

/**
 * Траты списываются с конверта только при ненулевом лимите (opening + allocated).
 * Иначе они идут из свободного пула, а не создают «минус» на карточке категории.
 */
export function shouldAttributeExpenseToEnvelope(
  categoryType: string,
  openingBalance: number,
  allocated: number,
): boolean {
  if (categoryType === 'savings') {
    return true
  }

  return openingBalance > 0 || allocated > 0
}
