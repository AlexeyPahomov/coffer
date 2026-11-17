import { pluralRu } from '@/shared/lib/plural'

/** Подпись количества планов для timeline. */
export function formatPlannedExpenseCount(count: number): string {
  if (count === 0) {
    return 'нет планов'
  }

  return `${count} ${pluralRu(count, 'план', 'плана', 'планов')}`
}
