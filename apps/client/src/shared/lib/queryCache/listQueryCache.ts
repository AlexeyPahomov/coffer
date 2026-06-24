import type { QueryClient, QueryKey } from '@tanstack/react-query'

type Identifiable = { id: string }

export function appendToListQuery<T extends Identifiable>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  item: T,
): void {
  queryClient.setQueryData<T[]>(queryKey, (current) => {
    const list = current ?? []
    if (list.some((row) => row.id === item.id)) {
      return list
    }
    return [item, ...list]
  })
}

export function updateInListQuery<T extends Identifiable>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string,
  patch: Partial<T> | ((current: T) => T),
): void {
  queryClient.setQueryData<T[]>(queryKey, (current) => {
    if (!current) {
      return current
    }

    return current.map((row) => {
      if (row.id !== id) {
        return row
      }
      return typeof patch === 'function' ? patch(row) : { ...row, ...patch }
    })
  })
}

export function removeFromListQuery<T extends Identifiable>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string,
): void {
  queryClient.setQueryData<T[]>(queryKey, (current) =>
    current ? current.filter((row) => row.id !== id) : current,
  )
}
