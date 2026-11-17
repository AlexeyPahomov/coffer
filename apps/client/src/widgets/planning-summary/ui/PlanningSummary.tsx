import type { ReactNode } from 'react'

import type { PlannedEvent } from '@/entities/planned-event/model/types'
import { cn } from '@/shared/lib/utils'

import type { PlanningSummary as PlanningSummaryData } from '../lib/buildPlanningSummary'
import { PlanningSummaryEvents } from './PlanningSummaryEvents'
import { PlanningSummaryHeadline } from './PlanningSummaryHeadline'
import { PlanningSummarySavings } from './PlanningSummarySavings'
import { PlanningSummaryTimeline } from './PlanningSummaryTimeline'

export type PlanningSummaryProps = {
  summary: PlanningSummaryData
  events: readonly PlannedEvent[]
  /** Переключатель горизонта сводки (свой, не связан с вкладкой «Прогноз»). */
  horizonControl: ReactNode
  onEditEvent: (event: PlannedEvent) => void
  onDeleteEvent: (id: string) => void
  pendingDeleteEventId?: string
  isEventsLoading?: boolean
  eventsError?: string | null
  className?: string
}

const cardClassName =
  'space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5'

export function PlanningSummary({
  summary,
  events,
  horizonControl,
  onEditEvent,
  onDeleteEvent,
  pendingDeleteEventId,
  isEventsLoading,
  eventsError,
  className,
}: PlanningSummaryProps) {
  return (
    <div className={cn('flex flex-col gap-4 md:gap-6', className)}>
      <section className={cardClassName}>
        <header className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-800">Сводка планов</h3>
          {horizonControl}
        </header>
        {summary.total > 0 ? (
          <PlanningSummaryHeadline summary={summary} />
        ) : (
          <p className="text-sm text-zinc-500">
            На горизонте нет предстоящих планов.
          </p>
        )}
      </section>

      {summary.total > 0 ? (
        <section className={cardClassName}>
          <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold text-zinc-800">
              Планы по месяцам
            </h3>
            <span className="text-xs text-zinc-500">
              Нажмите на месяц, чтобы увидеть его планы
            </span>
          </header>
          <PlanningSummaryTimeline summary={summary} events={events} />
        </section>
      ) : null}

      <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={cardClassName}>
          <h3 className="text-sm font-semibold text-zinc-800">События</h3>
          <PlanningSummaryEvents
            events={summary.events}
            onEditEvent={onEditEvent}
            onDeleteEvent={onDeleteEvent}
            pendingDeleteEventId={pendingDeleteEventId}
            isLoading={isEventsLoading}
            error={eventsError}
          />
        </section>
        <section className={cardClassName}>
          <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold text-zinc-800">
              Накопления после планов
            </h3>
            <span className="text-xs text-zinc-500">на конец месяца</span>
          </header>
          <PlanningSummarySavings summary={summary} />
        </section>
      </div>
    </div>
  )
}
