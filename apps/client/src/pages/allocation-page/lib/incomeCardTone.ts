import type { IncomeCardTone } from '@/pages/allocation-page/lib/allocationIncomeCard'

export function getToneTextClassName(tone: IncomeCardTone): string {
  if (tone === 'over') {
    return 'text-red'
  }
  if (tone === 'full') {
    return 'text-green'
  }
  if (tone === 'partial') {
    return 'text-blue'
  }

  return 'text-orange'
}

export function getToneSurfaceClassName(tone: IncomeCardTone): string {
  if (tone === 'over') {
    return 'bg-linear-to-br from-red-subtle via-red-subtle to-white/95'
  }
  if (tone === 'full') {
    return 'bg-linear-to-br from-green-subtle via-green-subtle to-white/95'
  }
  if (tone === 'partial') {
    return 'bg-linear-to-br from-blue-subtle via-teal-subtle to-white/95'
  }

  return 'bg-linear-to-br from-orange-subtle via-orange-subtle to-white/95'
}
