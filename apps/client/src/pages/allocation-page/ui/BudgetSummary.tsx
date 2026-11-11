import type { ComponentType } from 'react'

import { Clock, PieChart, Wallet } from 'lucide-react'

import { formatAmount } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

import type { BudgetSummary as BudgetSummaryData } from '../lib/buildBudgetSummary'
import {
  getToneSurfaceClassName,
  getToneTextClassName,
} from '../lib/incomeCardTone'
import { useRemainingBalanceMetrics } from '../model/useRemainingBalanceMetrics'

const cardClassName =
  'flex min-w-0 flex-col gap-0.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 shadow-sm'
const labelClassName = 'text-xs font-medium text-zinc-500'
const valueClassName = 'text-lg font-bold tabular-nums text-zinc-900'
const captionClassName = 'truncate text-xs text-zinc-500 tabular-nums'

function Rub() {
  return (
    <span className="ms-1 text-sm font-semibold opacity-45" aria-hidden>
      ₽
    </span>
  )
}

type BudgetSummaryProps = {
  summary: BudgetSummaryData
}

/** Воронка месяца: десктоп — четыре карточки, мобилка — строка «Осталось». */
export function BudgetSummary({ summary }: BudgetSummaryProps) {
  const { displayRemaining, displayPercent } = useRemainingBalanceMetrics({
    remainingBalance: summary.remaining,
    allocatedPercent: summary.allocatedPercent,
  })
  const toneTextClassName = getToneTextClassName(summary.tone)

  const steps: {
    label: string
    value: number
    caption: string
    Icon: ComponentType<{ className?: string }>
    iconClassName: string
  }[] = [
    {
      label: 'Ожидается',
      value: summary.expected,
      caption:
        summary.expectedCount > 0
          ? `не получено: ${summary.expectedCount}`
          : summary.received > 0
            ? 'всё получено'
            : 'нет доходов',
      Icon: Clock,
      iconClassName: 'bg-slate-subtle text-slate',
    },
    {
      label: 'Получено',
      value: summary.received,
      caption: `${summary.receivedPercent}% доходов месяца`,
      Icon: Wallet,
      iconClassName: 'bg-green-subtle text-green',
    },
    {
      label: 'Распределено',
      value: summary.allocated,
      caption: `${displayPercent}% от полученного`,
      Icon: PieChart,
      iconClassName: 'bg-blue-subtle text-blue',
    },
  ]

  return (
    <>
      <div className="hidden grid-cols-4 gap-3 md:grid">
        {steps.map((step) => (
          <div key={step.label} className={cardClassName}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-md',
                  step.iconClassName,
                )}
                aria-hidden
              >
                <step.Icon className="size-3.5" />
              </span>
              <p className={labelClassName}>{step.label}</p>
            </div>
            <p className={valueClassName}>
              {formatAmount(step.value)}
              <Rub />
            </p>
            <p className={captionClassName}>{step.caption}</p>
          </div>
        ))}
        <div
          className={cn(
            cardClassName,
            'border-transparent',
            getToneSurfaceClassName(summary.tone),
          )}
        >
          <div className="flex h-6 items-center">
            <p className={labelClassName}>Осталось</p>
          </div>
          <p className={cn(valueClassName, toneTextClassName)}>
            {formatAmount(displayRemaining)}
            <Rub />
          </p>
          <p className={captionClassName}>свободно к распределению</p>
        </div>
      </div>

      <div
        className={cn(
          'flex items-baseline justify-between gap-3 rounded-xl px-3 py-2 md:hidden',
          getToneSurfaceClassName(summary.tone),
        )}
      >
        <p className="text-sm font-medium text-zinc-600">Осталось</p>
        <p className="flex items-baseline gap-2">
          <span className={cn('text-lg font-bold tabular-nums', toneTextClassName)}>
            {formatAmount(displayRemaining)}
            <Rub />
          </span>
          <span className="text-xs text-zinc-500 tabular-nums">
            {displayPercent}% распределено
          </span>
        </p>
      </div>
    </>
  )
}
