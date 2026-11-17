import { useDeletePlannedEventMutation } from '@/entities/planned-event/api/useDeletePlannedEventMutation'
import type { PlannedEvent } from '@/entities/planned-event/model/types'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button, ResponsiveFormDialog } from '@/shared/ui'

export type DeletePlannedEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: PlannedEvent | null
}

export function DeletePlannedEventDialog({
  open,
  onOpenChange,
  event,
}: DeletePlannedEventDialogProps) {
  const mutation = useDeletePlannedEventMutation()

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      mutation.reset()
    }
    onOpenChange(nextOpen)
  }

  const confirm = () => {
    if (!event) {
      return
    }
    mutation.mutate(event.id, { onSuccess: () => handleOpenChange(false) })
  }

  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Удалить событие?"
      description={
        event
          ? `«${event.title}» будет удалено. Планы останутся, но без события.`
          : ''
      }
    >
      {mutation.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(mutation.error, 'Не удалось удалить событие')}
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        variant="destructive"
        className="w-full"
        isLoading={mutation.isPending}
        disabled={mutation.isPending}
        onClick={confirm}
      >
        Удалить
      </Button>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="w-full"
        disabled={mutation.isPending}
        onClick={() => handleOpenChange(false)}
      >
        Отмена
      </Button>
    </ResponsiveFormDialog>
  )
}
