import {
  BUDGET_METRIC_LABELS,
  POOL_AVAILABLE_NOW_LABEL,
} from './budgetMetricLabels'
import { formatPlanningPeriodLabel } from './periodLabels'

export function planningForecastMetricTitle(periodMonth: string): string {
  return `Прогноз на ${formatPlanningPeriodLabel(periodMonth)}`
}

export const PLANNING_METRIC_COPY = {
  forecast: {
    caption: 'Остаток после ожидаемых поступлений и планов',
    infoText: `${POOL_AVAILABLE_NOW_LABEL} плюс ожидаемые доходы выбранного месяца, минус запланированные траты и уже зарезервированные суммы.`,
  },
  pool: {
    title: BUDGET_METRIC_LABELS.poolAvailableNow,
    caption: 'Фактический свободный пул',
    infoText:
      'Реальные полученные деньги, которые ещё не распределены по конвертам. Ожидаемые доходы сюда не входят.',
  },
  income: {
    title: BUDGET_METRIC_LABELS.expectedIncome,
    caption: 'Будущие поступления',
    infoText:
      'Доходы со статусом «Ожидается» в выбранном месяце. Они участвуют только в прогнозе, но не в фактическом бюджете.',
  },
  planned: {
    title: BUDGET_METRIC_LABELS.planned,
    caption: 'Запланированные траты',
    infoText: 'Сумма планов со статусом «План», ещё не зарезервированная.',
  },
  reserved: {
    title: BUDGET_METRIC_LABELS.reserved,
    caption: 'Замороженные средства',
    infoText: 'Сумма планов, по которым ликвидность уже заморожена.',
  },
} as const
