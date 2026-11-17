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
