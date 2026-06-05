import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  Landmark,
  Lock,
  PieChart,
  Plus,
  Wallet,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'

import {
  liquidityFlowNodeLabels,
  type LiquidityFlowNodeKind,
} from './liquidityFlowCopy'
import {
  liquidityFlowCardMaxHeightClassName,
  liquidityFlowTrackScrollHeightClassName,
} from './liquidityFlowDimensions'
import { infoHintTitleRowClassName } from '@/shared/ui/info-hint/infoHintLayout'

export type { LiquidityFlowNodeKind }

export type LiquidityFlowNodeConfig = {
  kind: LiquidityFlowNodeKind
  label: string
  icon: LucideIcon
  iconWrapClassName: string
  amountClassName: string
}

const nodeConfig: Record<
  LiquidityFlowNodeKind,
  Omit<LiquidityFlowNodeConfig, 'kind' | 'label'>
> = {
  income: {
    icon: Plus,
    iconWrapClassName: 'bg-emerald-100 text-emerald-600',
    amountClassName: 'text-zinc-900',
  },
  envelopeAllocation: {
    icon: PieChart,
    iconWrapClassName: 'bg-violet-100 text-violet-600',
    amountClassName: 'text-violet-700',
  },
  pool: {
    icon: Wallet,
    iconWrapClassName: 'bg-teal-subtle text-teal',
    amountClassName: 'text-teal',
  },
  planned: {
    icon: Calendar,
    iconWrapClassName: 'bg-blue-subtle text-blue',
    amountClassName: 'text-blue',
  },
  reserved: {
    icon: Lock,
    iconWrapClassName: 'bg-orange-subtle text-orange',
    amountClassName: 'text-orange',
  },
  forecast: {
    icon: Landmark,
    iconWrapClassName: 'bg-green-subtle text-green',
    amountClassName: 'text-green',
  },
}

export function getLiquidityFlowNodeConfig(
  kind: LiquidityFlowNodeKind,
): LiquidityFlowNodeConfig {
  return { kind, label: liquidityFlowNodeLabels[kind], ...nodeConfig[kind] }
}

export const liquidityFlowCardClassName = cn(
  'relative flex shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-3 shadow-sm sm:p-4',
  liquidityFlowCardMaxHeightClassName,
)

export const liquidityFlowHeaderClassName = cn(
  infoHintTitleRowClassName,
  'shrink-0 pb-2',
)

export const liquidityFlowTitleClassName =
  'min-w-0 text-sm font-medium text-zinc-900 sm:text-base'

export const liquidityFlowTrackScrollClassName = cn(
  'coffer-scroll-list overflow-y-auto overscroll-y-auto py-2 pe-2',
  liquidityFlowTrackScrollHeightClassName,
  'sm:overflow-x-auto sm:overflow-y-hidden sm:pb-2 sm:pe-0 sm:pt-1',
)

export const liquidityFlowTrackClassName =
  'flex w-full min-w-0 flex-col items-center gap-2 sm:w-max sm:flex-row sm:flex-nowrap sm:items-center sm:gap-3 lg:gap-4'

export const liquidityFlowNodeClassName =
  'flex w-full items-center justify-center gap-2.5 sm:w-auto sm:shrink-0 sm:justify-start'

export const liquidityFlowIconWrapClassName =
  'flex size-9 shrink-0 items-center justify-center rounded-full'

export const liquidityFlowAmountBaseClassName =
  'text-base font-bold leading-tight tabular-nums'

export const liquidityFlowLabelClassName = 'text-xs leading-tight text-zinc-500'

export const liquidityFlowArrowWrapClassName =
  'flex w-full items-center justify-center py-0.5 sm:w-auto sm:shrink-0 sm:px-1 sm:py-0'

export const liquidityFlowArrowClassName =
  'size-4 rotate-90 text-zinc-400 sm:rotate-0'

export function liquidityFlowAmountClassName(
  kind: LiquidityFlowNodeKind,
  amount: number,
): string {
  const base = nodeConfig[kind].amountClassName

  if (amount < 0 && (kind === 'pool' || kind === 'forecast')) {
    return cn(base, 'text-destructive')
  }

  return base
}
