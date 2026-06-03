import { useCallback } from 'react'

type UseCardActivateOptions = {
  /** ПК: правый клик вызывает действие. */
  contextMenu?: boolean
  ariaLabel?: string
}

function isCardActivateSuppressedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [data-card-action]',
    ),
  )
}

export function useCardActivate(
  onActivate: () => void,
  { contextMenu = false, ariaLabel }: UseCardActivateOptions = {},
) {
  const onClick = useCallback(
    (event: React.MouseEvent) => {
      if (isCardActivateSuppressedTarget(event.target)) {
        return
      }
      onActivate()
    },
    [onActivate],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onActivate()
      }
    },
    [onActivate],
  )

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      onActivate()
    },
    [onActivate],
  )

  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': ariaLabel,
    onClick,
    onKeyDown,
    ...(contextMenu ? { onContextMenu } : {}),
  }
}
