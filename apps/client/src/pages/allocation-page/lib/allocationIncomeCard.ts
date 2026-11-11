export type IncomeCardTone = 'empty' | 'partial' | 'full' | 'over'

export function resolveIncomeCardTone(
  allocated: number,
  allocatedPercent: number,
): IncomeCardTone {
  if (allocated <= 0) {
    return 'empty'
  }

  return allocatedPercent >= 98 ? 'full' : 'partial'
}
