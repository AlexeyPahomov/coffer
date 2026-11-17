export const PLANNING_TABS = [
  { id: 'plans', label: 'Планы' },
  { id: 'forecast', label: 'Прогноз' },
  { id: 'summary', label: 'Сводка' },
] as const

export type PlanningTabId = (typeof PLANNING_TABS)[number]['id']
