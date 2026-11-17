import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client'

import type { PlannedEvent, PlannedEventPayload } from '../model/types'

const PLANNED_EVENT_PATH = '/planned-event'

export function getPlannedEvents(): Promise<PlannedEvent[]> {
  return apiGet<PlannedEvent[]>(PLANNED_EVENT_PATH)
}

export function createPlannedEvent(
  payload: PlannedEventPayload,
): Promise<PlannedEvent> {
  return apiPost<PlannedEvent>(PLANNED_EVENT_PATH, payload)
}

export function updatePlannedEvent(
  id: string,
  payload: PlannedEventPayload,
): Promise<PlannedEvent> {
  return apiPatch<PlannedEvent>(
    `${PLANNED_EVENT_PATH}/${encodeURIComponent(id)}`,
    payload,
  )
}

export function deletePlannedEvent(id: string): Promise<void> {
  return apiDelete<void>(`${PLANNED_EVENT_PATH}/${encodeURIComponent(id)}`)
}
