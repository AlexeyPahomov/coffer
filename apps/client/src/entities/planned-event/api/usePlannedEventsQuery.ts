import { useQuery } from '@tanstack/react-query'

import { getPlannedEvents } from './plannedEventApi'
import { plannedEventQueryKeys } from './plannedEventQueryKeys'

export function usePlannedEventsQuery() {
  return useQuery({
    queryKey: plannedEventQueryKeys.all,
    queryFn: getPlannedEvents,
  })
}
