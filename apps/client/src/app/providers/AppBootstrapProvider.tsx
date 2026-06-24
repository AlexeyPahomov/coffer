import { type ReactNode } from 'react'

import { useBootstrapQuery } from '@/entities/bootstrap'
import { Spinner } from '@/shared/ui'

type AppBootstrapProviderProps = {
  children: ReactNode
}

function AppBootstrapFallback() {
  return (
    <div
      className="flex h-screen h-dvh items-center justify-center bg-zinc-100 text-zinc-900"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="size-8 text-zinc-500" aria-label="Загрузка приложения" />
    </div>
  )
}

/**
 * Первичная загрузка через GET /bootstrap и seed кэша entity-queries.
 * При ошибке bootstrap дочерние страницы грузят данные по-старому.
 */
export function AppBootstrapProvider({ children }: AppBootstrapProviderProps) {
  const bootstrap = useBootstrapQuery()

  if (bootstrap.isPending && bootstrap.data === undefined) {
    return <AppBootstrapFallback />
  }

  return children
}
