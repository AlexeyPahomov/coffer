import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Spinner } from '../spinner/Spinner'

import { ItemsListInteractive } from './ItemsListInteractive'
import { ItemsListTitle } from './ItemsListTitle'
import { itemsListShellClassName } from './itemsListLayout'

type ItemsListHeaderProps = {
  title?: string
  headerEnd?: ReactNode
  headerAddon?: ReactNode
  isFetching: boolean
  isPending: boolean
  onTitleClick?: () => void
}

export function ItemsListHeader({
  title,
  headerEnd,
  headerAddon,
  isFetching,
  isPending,
  onTitleClick,
}: ItemsListHeaderProps) {
  const showFetchingSpinner = isFetching && !isPending
  const showHeaderRow = Boolean(title) || headerEnd != null

  if (!showHeaderRow && headerAddon == null) {
    return null
  }

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-1',
        itemsListShellClassName,
      )}
    >
      {showHeaderRow ? (
        <div
          className={cn(
            'flex items-center gap-2 px-2',
            itemsListShellClassName,
            title ? 'justify-between' : 'justify-end',
          )}
        >
          {title || (showFetchingSpinner && showHeaderRow) ? (
            <ItemsListInteractive className="flex min-w-0 items-center gap-2">
              {title ? (
                <ItemsListTitle onClick={onTitleClick}>{title}</ItemsListTitle>
              ) : null}
              {showFetchingSpinner ? (
                <Spinner
                  className="size-4 shrink-0 text-zinc-500"
                  aria-label="Обновление списка"
                />
              ) : null}
            </ItemsListInteractive>
          ) : null}
          {headerEnd ? (
            <ItemsListInteractive className="flex shrink-0 items-center gap-2">
              {headerEnd}
            </ItemsListInteractive>
          ) : null}
        </div>
      ) : null}
      {headerAddon ? (
        <ItemsListInteractive>{headerAddon}</ItemsListInteractive>
      ) : null}
    </div>
  )
}
