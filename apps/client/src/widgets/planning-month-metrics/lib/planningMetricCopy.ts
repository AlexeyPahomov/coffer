import { formatPlanningPeriodLabel } from '@/entities/budget/lib/periodLabels'

export function planningForecastMetricTitle(periodMonth: string): string {
  return `Прогноз на ${formatPlanningPeriodLabel(periodMonth)}`
}

export const PLANNING_METRIC_COPY = {
  forecast: {
    caption: 'Остаток после ожидаемых поступлений и планов',
    infoText:
      'Доступно сейчас плюс ожидаемые доходы выбранного месяца, минус запланированные траты и уже зарезервированные суммы.',
  },
  pool: {
    title: 'Доступно сейчас',
    caption: 'Фактический свободный пул',
    infoText:
      'Реальные полученные деньги, которые ещё не распределены по конвертам. Ожидаемые доходы сюда не входят.',
  },
  income: {
    title: 'Ожидается',
    caption: 'Будущие поступления',
    infoText:
      'Доходы со статусом «Ожидается» в выбранном месяце. Они участвуют только в прогнозе, но не в фактическом бюджете.',
  },
  planned: {
    title: 'В планах',
    caption: 'Запланированные траты',
    infoText: 'Сумма планов со статусом «План», ещё не зарезервированная.',
  },
  reserved: {
    title: 'Зарезервировано',
    caption: 'Замороженные средства',
    infoText: 'Сумма планов, по которым ликвидность уже заморожена.',
  },
} as const
