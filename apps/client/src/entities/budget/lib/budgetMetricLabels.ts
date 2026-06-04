/** Заголовок блока свободного пула на сводках бюджета (страница «Расход»). */
export const FREE_FUNDS_LABEL = 'Свободные средства'

/** Фактический свободный пул: планирование, поток ликвидности. */
export const POOL_AVAILABLE_NOW_LABEL = 'Доступно сейчас'

/** Общие короткие подписи метрик бюджета и планирования. */
export const BUDGET_METRIC_LABELS = {
  freeFunds: FREE_FUNDS_LABEL,
  poolAvailableNow: POOL_AVAILABLE_NOW_LABEL,
  expectedIncome: 'Ожидается',
  planned: 'В планах',
  reserved: 'Зарезервировано',
  forecastRemainder: 'Ожидаемый остаток',
  spentFact: 'Фактически потрачено',
  spentShort: 'Потрачено',
  reserve: 'Накопления',
} as const
