import type { EnvelopeBalanceTone } from '@/entities/budget/lib/envelopeBalanceTone'

const toneAccentClassName: Record<EnvelopeBalanceTone, string> = {
  healthy: 'bg-blue-subtle text-blue',
  done: 'bg-sage-subtle text-sage',
  low: 'bg-orange-subtle text-orange',
  over: 'bg-red-subtle text-red',
}

const toneTextClassName: Record<EnvelopeBalanceTone, string> = {
  healthy: 'text-blue',
  done: 'text-sage',
  low: 'text-orange',
  over: 'text-red',
}

export function categoryIconWrapClassName(tone: EnvelopeBalanceTone): string {
  return toneAccentClassName[tone]
}

export function categoryAccentTextClassName(tone: EnvelopeBalanceTone): string {
  return toneTextClassName[tone]
}
