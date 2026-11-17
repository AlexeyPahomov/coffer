import {
  CalendarRange,
  Map as MapIcon,
  Mountain,
  PiggyBank,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { formatPeriodMonthGenitive } from '@/entities/budget/lib/periodLabels'
import { formatMoneyWithRub } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

import type { PlanningSummary } from '../lib/buildPlanningSummary'
import {
  FUNDING_SOURCES,
  pluralRu,
  sharePercent,
} from '../lib/planningSummaryFormat'

type Fact = { icon: LucideIcon; warn?: boolean; text: ReactNode }

function buildFacts(summary: PlanningSummary): Fact[] {
  const facts: Fact[] = []
  const { bigPlans, peakMonth, events, deficitMonths, lowestSavingsMonth } =
    summary

  if (bigPlans.length > 0) {
    facts.push({
      icon: Mountain,
      text: (
        <>
          <b className="font-semibold">
            {bigPlans.length}{' '}
            {pluralRu(bigPlans.length, 'крупная трата', 'крупные траты', 'крупных трат')}
          </b>{' '}
          — {sharePercent(summary.bigTotal, summary.total)}% всех планов.
        </>
      ),
    })
  }
  if (peakMonth) {
    const [main] = peakMonth.plans
    facts.push({
      icon: CalendarRange,
      text: (
        <>
          Пиковый месяц —{' '}
          <b className="font-semibold">{peakMonth.label.toLowerCase()}</b>:{' '}
          {formatMoneyWithRub(peakMonth.total)}, главное — {main.title} (
          {formatMoneyWithRub(main.amount)}).
        </>
      ),
    })
  }
  const horizonEvents = events
    .filter((e) => e.horizonTotal > 0)
    .sort((a, b) => b.horizonTotal - a.horizonTotal)
  if (horizonEvents.length > 0) {
    const eventsTotal = horizonEvents.reduce((sum, e) => sum + e.horizonTotal, 0)
    facts.push({
      icon: MapIcon,
      text: (
        <>
          События забирают{' '}
          <b className="font-semibold">
            {sharePercent(eventsTotal, summary.total)}%
          </b>{' '}
          планов:{' '}
          {horizonEvents
            .map(
              (e) => `${e.event.title} — ${formatMoneyWithRub(e.horizonTotal)}`,
            )
            .join(', ')}
          .
        </>
      ),
    })
  }
  if (deficitMonths.length > 0) {
    facts.push({
      icon: TriangleAlert,
      warn: true,
      text: (
        <>
          Свободного пула не хватает:{' '}
          {deficitMonths
            .map(
              (m) =>
                `${m.label.toLowerCase()} (−${formatMoneyWithRub(m.deficit)})`,
            )
            .join(', ')}
          .
        </>
      ),
    })
  }
  if (lowestSavingsMonth) {
    facts.push({
      icon: PiggyBank,
      warn: lowestSavingsMonth.savingsBalance < 0,
      text: (
        <>
          Накопления проседают до{' '}
          <b className="font-semibold">
            {formatMoneyWithRub(lowestSavingsMonth.savingsBalance)}
          </b>{' '}
          на конец {formatPeriodMonthGenitive(lowestSavingsMonth.month)}.
        </>
      ),
    })
  }
  return facts
}

export function PlanningSummaryHeadline({
  summary,
}: {
  summary: PlanningSummary
}) {
  const facts = buildFacts(summary)

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
      <div className="min-w-0">
        <p className="text-sm text-zinc-500">
          Запланировано на {summary.months.length}{' '}
          {pluralRu(summary.months.length, 'месяц', 'месяца', 'месяцев')}
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">
          {formatMoneyWithRub(summary.total)}
        </p>
        <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-zinc-100">
          {FUNDING_SOURCES.filter(({ key }) => summary.sources[key] > 0).map(
            ({ key, label, className }) => (
              <span
                key={key}
                className={className}
                style={{ flexGrow: summary.sources[key] }}
                title={label}
              />
            ),
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
          {FUNDING_SOURCES.map(({ key, label, className }) => (
            <li key={key} className="flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-sm', className)} aria-hidden />
              {label}
              <span className="font-semibold tabular-nums">
                {sharePercent(summary.sources[key], summary.total)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="flex min-w-0 flex-col gap-2.5 text-sm text-zinc-700">
        {facts.map(({ icon: Icon, warn, text }, index) => (
          <li key={index} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2">
            <Icon
              className={cn(
                'mt-0.5 size-4.5',
                warn ? 'text-amber-600' : 'text-zinc-400',
              )}
              aria-hidden
            />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
