import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { PlannedEvent, PlannedEventPayload } from '../model/types'
import { createPlannedEvent } from './plannedEventApi'
import { plannedEventQueryKeys } from './plannedEventQueryKeys'

export function useCreatePlannedEventMutation() {
  const queryClient = useQueryClient()

  return useMutation<PlannedEvent, Error, PlannedEventPayload>({
    mutationFn: createPlannedEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: plannedEventQueryKeys.all }),
  })
}
