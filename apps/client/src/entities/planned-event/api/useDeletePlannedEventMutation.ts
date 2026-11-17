import { useMutation, useQueryClient } from '@tanstack/react-query'

import { plannedExpenseQueryKeys } from '@/entities/planned-expense/api/plannedExpenseQueryKeys'

import { deletePlannedEvent } from './plannedEventApi'
import { plannedEventQueryKeys } from './plannedEventQueryKeys'

export function useDeletePlannedEventMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deletePlannedEvent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plannedEventQueryKeys.all })
      // Сервер отвязал планы события (event_id → null).
      void queryClient.invalidateQueries({
        queryKey: plannedExpenseQueryKeys.all,
      })
    },
  })
}
