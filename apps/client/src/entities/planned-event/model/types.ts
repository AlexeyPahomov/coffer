/** Событие (поездка, праздник), объединяющее несколько планов. */
export type PlannedEvent = {
  id: string
  title: string
  icon_name: string
  icon_color: string
}

export type PlannedEventPayload = {
  title: string
  icon_name: string
  icon_color: string
}
