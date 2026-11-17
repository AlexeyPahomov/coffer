import { useState } from 'react'

import { useUpdatePlannedEventMutation } from '@/entities/planned-event/api/useUpdatePlannedEventMutation'
import type { PlannedEvent } from '@/entities/planned-event/model/types'
import { PlannedExpenseIconPicker } from '@/entities/planned-expense/ui/PlannedExpenseIconPicker'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button, Input, ResponsiveFormDialog } from '@/shared/ui'

export type EditPlannedEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: PlannedEvent | null
}

function EditPlannedEventForm({
  event,
  onDone,
}: {
  event: PlannedEvent
  onDone: () => void
}) {
  const mutation = useUpdatePlannedEventMutation()
  const [title, setTitle] = useState(event.title)
  const [iconName, setIconName] = useState(event.icon_name)
  const [iconColor, setIconColor] = useState(event.icon_color)

  const submit = async () => {
    try {
      await mutation.mutateAsync({
        id: event.id,
        payload: {
          title: title.trim(),
          icon_name: iconName,
          icon_color: iconColor,
        },
      })
      onDone()
    } catch {
      // ошибка уже в mutation.error
    }
  }

  return (
    <>
      <PlannedExpenseIconPicker
        iconName={iconName}
        iconColor={iconColor}
        disabled={mutation.isPending}
        onIconChange={setIconName}
        onColorChange={setIconColor}
      />
      <Input
        name="title"
        placeholder="Название события"
        value={title}
        disabled={mutation.isPending}
        onChange={(e) => setTitle(e.target.value)}
      />
      {mutation.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(mutation.error, 'Не удалось сохранить событие')}
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="w-full"
        isLoading={mutation.isPending}
        disabled={mutation.isPending || !title.trim()}
        onClick={() => void submit()}
      >
        Сохранить
      </Button>
    </>
  )
}

export function EditPlannedEventDialog({
  open,
  onOpenChange,
  event,
}: EditPlannedEventDialogProps) {
  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Событие"
      description="Название и иконка события"
    >
      {event ? (
        <EditPlannedEventForm
          key={event.id}
          event={event}
          onDone={() => onOpenChange(false)}
        />
      ) : null}
    </ResponsiveFormDialog>
  )
}
