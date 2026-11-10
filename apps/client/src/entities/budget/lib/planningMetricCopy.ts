import { formatAmount } from '@/shared/lib/format'

import { BUDGET_METRIC_LABELS } from './budgetMetricLabels'

function formatPoolEnvelopeBreakdown(poolTotal: number, envelopeTotal: number) {
  return `Из пула ${formatAmount(poolTotal)} · из конвертов ${formatAmount(envelopeTotal)}`
}

export const PLANNING_METRIC_COPY = {
  forecast: {
    title: 'Остаток',
    caption: 'Прогнозируемый остаток после ожидаемых поступлений и планов',
    infoText:
      'Доступно сейчас плюс ожидаемые доходы, минус прогноз распределения по конвертам, минус планы и резервы из свободного пула.',
  },
  pool: {
    title: BUDGET_METRIC_LABELS.poolAvailableNow,
    caption: 'Фактический свободный пул',
    infoText:
      'Реальные полученные деньги, которые ещё не распределены по конвертам. Ожидаемые доходы сюда не входят.',
  },
  planned: {
    title: BUDGET_METRIC_LABELS.planned,
    caption: formatPoolEnvelopeBreakdown,
    infoText:
      'Все планы месяца, ещё не зарезервированные. В «Остаток» входят только планы из свободного пула: планы конвертов покрывает их аллокация.',
  },
  reserved: {
    title: BUDGET_METRIC_LABELS.reserved,
    caption: formatPoolEnvelopeBreakdown,
    infoText:
      'Сумма планов, по которым ликвидность уже заморожена. В «Остаток» входят только резервы из свободного пула: резервы конвертов лежат в их аллокации.',
  },
  savings: {
    title: BUDGET_METRIC_LABELS.reserve,
    caption: 'Текущие накопления',
    infoText: 'Сумма остатков по конвертам-накоплениям на текущий момент.',
  },
  savingsForecast: {
    title: BUDGET_METRIC_LABELS.reserve,
    caption: 'Накопления на конец месяца (прогноз)',
    infoText:
      'Текущие накопления плюс прогноз распределения в конверты-накопления до конца месяца, минус запланированные траты из них.',
  },
} as const
