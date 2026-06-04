import { FREE_FUNDS_LABEL } from './budgetMetricLabels'

export function buildExpenseBudgetCaption(
  periodMonth: string,
  useCycleEnvelopes: boolean,
  cycleStart?: string,
  cycleEndLabel?: string,
): string {
  if (useCycleEnvelopes && cycleStart) {
    const endLabel = cycleEndLabel ?? 'следующего дохода'
    return `Лимиты конвертов — по циклу дохода от ${cycleStart} до ${endLabel}. Траты без лимита и «${FREE_FUNDS_LABEL}» — за ${periodMonth} с переносом остатка.`
  }

  return `Конверты и «${FREE_FUNDS_LABEL}» за ${periodMonth} (как на странице распределения). История — по выбранному месяцу.`
}
