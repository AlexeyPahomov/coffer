import { useAnimatedNumber } from '@/shared/hooks/useAnimatedNumber'

type UseRemainingBalanceMetricsParams = {
  remainingBalance: number
  allocatedPercent: number
}

export function useRemainingBalanceMetrics({
  remainingBalance,
  allocatedPercent,
}: UseRemainingBalanceMetricsParams) {
  const animatedRemaining = useAnimatedNumber(remainingBalance)
  const animatedPercent = useAnimatedNumber(allocatedPercent)

  return {
    displayRemaining: Math.round(animatedRemaining),
    displayPercent: Math.round(animatedPercent),
  }
}
