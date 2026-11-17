import { Plus } from 'lucide-react'

import { PlannedExpenseIconAvatar } from '@/entities/planned-expense/ui/PlannedExpenseIconAvatar'
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/SelectPrimitives'

import { NEW_PLANNED_EVENT_VALUE } from '../lib/plannedEventSelectValue'
import type { PlannedEvent } from '../model/types'

type PlannedEventSelectProps = {
  id: string
  /** '' — без события, id события или `NEW_PLANNED_EVENT_VALUE`. */
  value: string
  onValueChange: (value: string) => void
  events: readonly PlannedEvent[]
  disabled?: boolean
}

const NO_EVENT_VALUE = '__planned_event_none__'

function PlannedEventName({ event }: { event: PlannedEvent }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <PlannedExpenseIconAvatar
        iconName={event.icon_name}
        iconColor={event.icon_color}
        className="size-6 [&_svg]:size-3.5"
      />
      <span className="truncate">{event.title}</span>
    </span>
  )
}

export function PlannedEventSelect({
  id,
  value,
  onValueChange,
  events,
  disabled,
}: PlannedEventSelectProps) {
  return (
    <SelectRoot
      value={value || NO_EVENT_VALUE}
      onValueChange={(next) =>
        onValueChange(next === NO_EVENT_VALUE ? '' : next)
      }
      disabled={disabled}
    >
      <SelectTrigger id={id} size="default" className="h-9 w-full min-w-0 pr-2">
        <SelectValue placeholder="Без события" />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="min-w-(--radix-select-trigger-width)"
      >
        <SelectItem value={NO_EVENT_VALUE} className="min-h-9 py-1.5 text-zinc-500">
          Без события
        </SelectItem>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id} className="min-h-9 py-1.5">
            <PlannedEventName event={event} />
          </SelectItem>
        ))}
        <SelectItem value={NEW_PLANNED_EVENT_VALUE} className="min-h-9 py-1.5">
          <span className="flex items-center gap-2 text-zinc-700">
            <Plus className="size-4" aria-hidden />
            Новое событие…
          </span>
        </SelectItem>
      </SelectContent>
    </SelectRoot>
  )
}
