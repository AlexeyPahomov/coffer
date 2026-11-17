import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import type { PlannedEvent } from '@/entities/planned-event/model/types'
import { formatMoneyWithRub } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

import {
  EMPTY_FUNDING_SOURCES,
  type PlanningSummary,
  type PlanningSummaryMonth,
} from '../lib/buildPlanningSummary'
import {
  FUNDING_SOURCES,
  formatCompactAmount,
} from '../lib/planningSummaryFormat'
import { PlanningSummaryPlanRow } from './PlanningSummaryPlanRow'

const BAR_AREA_HEIGHT_PX = 160

type PlanningSummaryTimelineProps = {
  summary: PlanningSummary
  events: readonly PlannedEvent[]
}

function MonthBar({
  month,
  max,
  isBigPlan,
  selected,
  onSelect,
}: {
  month: PlanningSummaryMonth
  max: number
  isBigPlan: (amount: number) => boolean
  selected: boolean
  onSelect: () => void
}) {
  const bigPlan = month.plans.find((plan) => isBigPlan(plan.amount))
  const segments = FUNDING_SOURCES.filter(({ key }) => month.sources[key] > 0)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${month.label}: ${formatMoneyWithRub(month.total)}`}
      className={cn(
        'group flex min-w-11 flex-1 flex-col items-center gap-1.5 rounded-xl px-1 pt-2 pb-1.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected ? 'bg-violet-50' : 'hover:bg-zinc-50',
      )}
    >
      <div
        className="flex w-full flex-col items-center justify-end"
        style={{ height: BAR_AREA_HEIGHT_PX }}
      >
        {month.total > 0 ? (
          <span className="mb-1 text-[11px] font-semibold text-zinc-700 tabular-nums">
            {formatCompactAmount(month.total)}
          </span>
        ) : null}
        <div
          className="flex w-full max-w-8 flex-col-reverse gap-0.5 overflow-hidden rounded-t-md"
          style={{
            height:
              max > 0 ? (month.total / max) * (BAR_AREA_HEIGHT_PX - 20) : 0,
          }}
        >
          {segments.map(({ key, className }) => (
            <span
              key={key}
              className={className}
              style={{ flexGrow: month.sources[key] }}
            />
          ))}
        </div>
        {month.deficit > 0 ? (
          <TriangleAlert className="mt-1 size-3.5 text-amber-600" aria-label="Дефицит пула" />
        ) : null}
      </div>
      <span
        className={cn(
          'text-xs',
          selected ? 'font-semibold text-violet-700' : 'text-zinc-500',
        )}
      >
        {month.label.slice(0, 3).toLowerCase()}
      </span>
      <span className="line-clamp-2 min-h-7 w-full text-center text-[10.5px] leading-3.5 text-zinc-500">
        {bigPlan?.title ?? ''}
      </span>
    </button>
  )
}

export function PlanningSummaryTimeline({
  summary,
  events,
}: PlanningSummaryTimelineProps) {
  const [pickedMonth, setPickedMonth] = useState<string | null>(null)
  const selected =
    summary.months.find((month) => month.month === pickedMonth) ??
    summary.peakMonth ??
    summary.months[0]
  const max = Math.max(...summary.months.map((month) => month.total))
  const isBigPlan = (amount: number) =>
    summary.bigPlanThreshold > 0 && amount >= summary.bigPlanThreshold
  const eventTitleById = new Map(events.map((event) => [event.id, event.title]))

  return (
    <div className="space-y-4">
      <div className="-mx-1 overflow-x-auto">
        <div className="flex min-w-max gap-0.5 px-1 md:min-w-0">
          {summary.months.map((month) => (
            <MonthBar
              key={month.month}
              month={month}
              max={max}
              isBigPlan={isBigPlan}
              selected={month.month === selected?.month}
              onSelect={() => setPickedMonth(month.month)}
            />
          ))}
        </div>
      </div>

      {selected ? (
        <div className="space-y-1 border-t border-zinc-100 pt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className="text-sm font-semibold text-zinc-800">
              {selected.label} ·{' '}
              <span className="tabular-nums">
                {formatMoneyWithRub(selected.total)}
              </span>
            </h4>
            {selected.deficit > 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                <TriangleAlert className="size-3.5" aria-hidden />
                Дефицит пула {formatMoneyWithRub(selected.deficit)}
              </span>
            ) : null}
          </div>
          {selected.plans.length > 0 ? (
            <ul className="divide-y divide-zinc-50">
              {selected.plans.map((plan) => (
                <PlanningSummaryPlanRow
                  key={plan.id}
                  plan={plan}
                  sources={
                    summary.planSources.get(plan.id) ?? EMPTY_FUNDING_SOURCES
                  }
                  isBig={isBigPlan(plan.amount)}
                  eventTitle={
                    plan.event_id ? eventTitleById.get(plan.event_id) : undefined
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="py-2 text-sm text-zinc-500">
              В этом месяце предстоящих планов нет.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
