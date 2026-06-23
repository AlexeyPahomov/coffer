import { formatAmount } from '@/shared/lib/format'

export type EnvelopeForecastAmountTone =
  | 'default'
  | 'forecast'
  | 'planned'
  | 'total'

const SIGNED_AMOUNT_PREFIX: Partial<
  Record<EnvelopeForecastAmountTone, string>
> = {
  forecast: '+',
  planned: '−',
}

export function formatEnvelopeForecastAmount(
  value: number,
  tone: EnvelopeForecastAmountTone = 'default',
): string {
  const prefix = value > 0 ? SIGNED_AMOUNT_PREFIX[tone] : undefined

  if (!prefix) {
    return formatAmount(value)
  }

  return `${prefix}${formatAmount(value)}`
}
