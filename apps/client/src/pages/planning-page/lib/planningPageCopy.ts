import { formatPlanningPeriodLabel } from '@/entities/budget/lib/periodLabels'

/** Прогноз будущего месяца считается от факта текущего — без его сводки цифры неверны. */
export const PLANNING_ANCHOR_SUMMARY_ERROR_MESSAGE =
  'Не удалось загрузить факт текущего месяца — прогноз недоступен'

export function planningPlansListTitle(periodMonth: string): string {
  return `Планы на ${formatPlanningPeriodLabel(periodMonth)}`
}
