import { formatAmount } from '@/shared/lib/format'

import { getEnvelopeBudgetTotal } from './envelope'

import type { CategoryBudgetItem } from '../model/types'

export type EnvelopeBalanceTone = 'healthy' | 'done' | 'low' | 'over'

const LOW_REMAINING_RATIO = 0.2

export function getEnvelopeBalanceTone(
  allocated: number,
  remaining: number,
  stressOverBudget = false,
): EnvelopeBalanceTone {
  if (remaining < 0 || stressOverBudget) {
    return 'over'
  }

  if (allocated <= 0) {
    return 'healthy'
  }

  // Конверт израсходован ровно в ноль — это «выполнено», а не предупреждение.
  if (remaining === 0) {
    return 'done'
  }

  if (remaining / allocated < LOW_REMAINING_RATIO) {
    return 'low'
  }

  return 'healthy'
}

export function getEnvelopeDisplayTone(item: CategoryBudgetItem): EnvelopeBalanceTone {
  return getEnvelopeBalanceTone(
    getEnvelopeBudgetTotal(item),
    item.remaining,
  )
}

export function getEnvelopeBalanceLabel(isSavings: boolean): string {
  return isSavings ? 'Накопления' : 'Остаток'
}

export function formatEnvelopeBalance(remaining: number): string {
  return formatAmount(remaining)
}

const cardToneClassName: Record<EnvelopeBalanceTone, string> = {
  healthy: 'bg-white ring-zinc-200/80',
  done: 'bg-white ring-zinc-200/80',
  low: 'bg-white ring-zinc-200/80',
  over: 'bg-white ring-zinc-200/80',
}

const balanceToneClassName: Record<EnvelopeBalanceTone, string> = {
  healthy: 'text-blue',
  done: 'text-sage',
  low: 'text-orange',
  over: 'text-red',
}

const hoverToneClassName: Record<EnvelopeBalanceTone, string> = {
  healthy: 'hover:bg-zinc-50/80',
  done: 'hover:bg-zinc-50/80',
  low: 'hover:bg-zinc-50/80',
  over: 'hover:bg-zinc-50/80',
}

const progressIndicatorToneClassName: Record<EnvelopeBalanceTone, string> = {
  healthy: 'bg-blue',
  done: 'bg-sage',
  low: 'bg-orange',
  over: 'bg-red',
}

export function envelopeCardToneClassName(tone: EnvelopeBalanceTone): string {
  return cardToneClassName[tone]
}

export function envelopeBalanceToneClassName(tone: EnvelopeBalanceTone): string {
  return balanceToneClassName[tone]
}

export function envelopeHoverToneClassName(tone: EnvelopeBalanceTone): string {
  return hoverToneClassName[tone]
}

export function envelopeProgressIndicatorClassName(
  tone: EnvelopeBalanceTone,
): string {
  return progressIndicatorToneClassName[tone]
}
