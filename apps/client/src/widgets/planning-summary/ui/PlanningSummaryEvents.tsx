import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

import { formatPlanningPeriodLabel } from '@/entities/budget'
import type { PlannedEvent } from '@/entities/planned-event/model/types'
import { PlannedExpenseIconAvatar } from '@/entities/planned-expense/ui/PlannedExpenseIconAvatar'
import { formatDateRangeLabelWithoutYear } from '@/shared/lib/date'
import { formatMoneyWithRub } from '@/shared/lib/format'
import { pluralRu } from '@/shared/lib/plural'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui'

import type { PlanningSummaryEvent } from '../lib/buildPlanningSummary'
import {
  formatCompactAmount,
  sharePercent,
} from '../lib/planningSummaryFormat'

type PlanningSummaryEventsProps = {
  events: readonly PlanningSummaryEvent[]
  onEditEvent: (event: PlannedEvent) => void
  onDeleteEvent: (event: PlannedEvent) => void
  isLoading?: boolean
  error?: string | null
}

/** «ноя» — краткое название месяца плана. */
function formatPlanMonth(periodMonth: string): string {
  return formatPlanningPeriodLabel(periodMonth).slice(0, 3).toLowerCase()
}

export function PlanningSummaryEvents({
  events,
  onEditEvent,
  onDeleteEvent,
  isLoading,
  error,
}: PlanningSummaryEventsProps) {
  const errorMessage = error ? (
    <p className="text-sm text-destructive">{error}</p>
  ) : null

  if (events.length === 0) {
    if (isLoading || error) {
      return errorMessage
    }
    return (
      <p className="text-sm text-zinc-500">
        Объедините планы одной поездки или праздника: выберите «Событие» в
        форме плана — здесь появится его полная стоимость.
      </p>
    )
  }

  return (
    <>
      {errorMessage}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {events.map(({ event, plans, total, savingsTotal, from, to }) => (
          <li
            key={event.id}
            className="flex min-w-0 flex-col gap-2 rounded-xl border border-zinc-200 p-3.5"
          >
            <div className="flex items-start gap-3">
              <PlannedExpenseIconAvatar
                iconName={event.icon_name}
                iconColor={event.icon_color}
                className="size-9"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {event.title}
                </p>
                <p className="text-base font-semibold text-zinc-900 tabular-nums">
                  {formatMoneyWithRub(total)}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Действия с событием"
                  >
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEditEvent(event)}>
                    <Pencil />
                    Изменить
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onDeleteEvent(event)}
                  >
                    <Trash2 />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {from ? (
              <p className="text-xs text-zinc-500">
                {plans.length} {pluralRu(plans.length, 'план', 'плана', 'планов')}{' '}
                · {formatDateRangeLabelWithoutYear(from, to)}
                {savingsTotal > 0
                  ? ` · из накоплений ${sharePercent(savingsTotal, total)}%`
                  : ''}
              </p>
            ) : (
              <p className="text-xs text-zinc-500">Нет предстоящих планов</p>
            )}
            <ul className="space-y-0.5 text-xs text-zinc-600">
              {plans.map((plan) => (
                <li key={plan.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {formatPlanMonth(plan.period_month)} · {plan.title}
                  </span>
                  <span className="tabular-nums">
                    {formatCompactAmount(plan.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  )
}
