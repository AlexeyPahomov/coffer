import {
  BUDGET_METRIC_LABELS,
  FREE_FUNDS_LABEL,
} from '@/entities/budget'
import { formatAmount } from '@/shared/lib/format'

export const CURRENT_BUDGET_AVAILABLE_LABEL = FREE_FUNDS_LABEL

export const CURRENT_BUDGET_AVAILABLE_INFO =
  'Полученные доходы за вычетом денег, уже разложенных по конвертам. Ожидаемые поступления сюда не входят. При перерасходе конверта остаток свободных средств уменьшается.'

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
  'Средства в категориях накоплений. Используйте только для целей накопления.'

export const CURRENT_BUDGET_METRIC_COPY = {
  available: {
    title: CURRENT_BUDGET_AVAILABLE_LABEL,
    caption: 'Фактический остаток',
  },
  reserve: {
    desktopTitle: BUDGET_METRIC_LABELS.reserve,
    mobileTitle: BUDGET_METRIC_LABELS.reserve,
    caption: 'Остаток по накоплениям',
    infoText: CURRENT_BUDGET_RESERVE_INFO,
  },
  spent: {
    desktopTitle: BUDGET_METRIC_LABELS.spentFact,
    mobileTitle: BUDGET_METRIC_LABELS.spentShort,
    caption: 'Фактические расходы',
    infoText: 'Сумма проведённых трат за выбранный месяц.',
  },
} as const
