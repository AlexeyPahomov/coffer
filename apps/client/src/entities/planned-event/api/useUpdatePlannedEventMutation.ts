import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { PlannedEvent, PlannedEventPayload } from '../model/types'
import { updatePlannedEvent } from './plannedEventApi'
import { plannedEventQueryKeys } from './plannedEventQueryKeys'

type UpdateArgs = {
  id: string
  payload: PlannedEventPayload
}

export function useUpdatePlannedEventMutation() {
  const queryClient = useQueryClient()

  return useMutation<PlannedEvent, Error, UpdateArgs>({
    mutationFn: ({ id, payload }) => updatePlannedEvent(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: plannedEventQueryKeys.all }),
  })
}
