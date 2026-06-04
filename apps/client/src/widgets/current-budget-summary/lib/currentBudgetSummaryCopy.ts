import { formatAmount } from '@/shared/lib/format'

export const CURRENT_BUDGET_AVAILABLE_INFO =
  'Полученные доходы за вычетом денег, уже разложенных по конвертам. Ожидаемые поступления сюда не входят. При перерасходе конверта свободный остаток уменьшается.'

export function buildCurrentBudgetAvailableInfo(
  carryForwardTotal: number,
  previousPeriodLabel?: string,
): string {
  if (carryForwardTotal === 0 || !previousPeriodLabel) {
    return CURRENT_BUDGET_AVAILABLE_INFO
  }

  const carryLine = `Перенесено с ${previousPeriodLabel}: ${formatAmount(carryForwardTotal)}.`

  return `${CURRENT_BUDGET_AVAILABLE_INFO} ${carryLine}`
}

export const CURRENT_BUDGET_RESERVE_INFO =
  'Резервные средства. Используйте только для целей накопления.'

export const CURRENT_BUDGET_RESERVE_LABEL = 'В резерве'

export const CURRENT_BUDGET_RESERVE_MOBILE_LABEL = 'Накопления'

export const CURRENT_BUDGET_METRIC_COPY = {
  available: {
    title: 'Нераспределено',
    caption: 'Фактический свободный пул',
  },
  reserve: {
    desktopTitle: CURRENT_BUDGET_RESERVE_LABEL,
    mobileTitle: CURRENT_BUDGET_RESERVE_MOBILE_LABEL,
    caption: 'Резерв и накопления',
    infoText: CURRENT_BUDGET_RESERVE_INFO,
  },
  spent: {
    desktopTitle: 'Фактически потрачено',
    mobileTitle: 'Потрачено',
    caption: 'Фактические расходы',
    infoText: 'Сумма проведённых трат за выбранный месяц.',
  },
} as const
