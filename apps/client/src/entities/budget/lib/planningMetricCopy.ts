import { BUDGET_METRIC_LABELS } from './budgetMetricLabels'

export const PLANNING_METRIC_COPY = {
  forecast: {
    title: 'Остаток',
    caption: 'Прогнозируемый остаток после ожидаемых поступлений и планов',
    infoText:
      'Доступно сейчас плюс ожидаемые доходы, минус прогноз распределения по конвертам, минус запланированные траты и уже зарезервированные суммы.',
  },
  pool: {
    title: BUDGET_METRIC_LABELS.poolAvailableNow,
    caption: 'Фактический свободный пул',
    infoText:
      'Реальные полученные деньги, которые ещё не распределены по конвертам. Ожидаемые доходы сюда не входят.',
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
  savings: {
    title: BUDGET_METRIC_LABELS.reserve,
    caption: 'Текущие накопления',
    infoText: 'Сумма остатков по конвертам-накоплениям на текущий момент.',
  },
} as const
