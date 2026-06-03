import * as React from 'react'

const DEFAULT_DELAY_MS = 450
const DEFAULT_MOVE_THRESHOLD_PX = 12

export type UseLongPressOptions = {
  onLongPress: () => void
  delayMs?: number
  moveThresholdPx?: number
  disabled?: boolean
}

function triggerLongPressHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(12)
  }
}

function isLongPressSuppressedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [data-card-action]',
    ),
  )
}

export function useLongPress({
  onLongPress,
  delayMs = DEFAULT_DELAY_MS,
  moveThresholdPx = DEFAULT_MOVE_THRESHOLD_PX,
  disabled = false,
}: UseLongPressOptions) {
  const [isPressing, setIsPressing] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = React.useRef<{ x: number; y: number } | null>(null)
  const pointerIdRef = React.useRef<number | null>(null)
  const didLongPressRef = React.useRef(false)

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetPress = React.useCallback(() => {
    clearTimer()
    startRef.current = null
    pointerIdRef.current = null
    setIsPressing(false)
  }, [clearTimer])

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || !event.isPrimary) {
        return
      }

      if (isLongPressSuppressedTarget(event.target)) {
        return
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }

      didLongPressRef.current = false
      startRef.current = { x: event.clientX, y: event.clientY }
      pointerIdRef.current = event.pointerId
      setIsPressing(true)

      event.currentTarget.setPointerCapture(event.pointerId)

      timerRef.current = setTimeout(() => {
        timerRef.current = null
        didLongPressRef.current = true
        triggerLongPressHaptic()
        onLongPress()
        setIsPressing(false)
      }, delayMs)
    },
    [delayMs, disabled, onLongPress],
  )

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!startRef.current || pointerIdRef.current !== event.pointerId) {
        return
      }

      const dx = event.clientX - startRef.current.x
      const dy = event.clientY - startRef.current.y

      if (Math.hypot(dx, dy) > moveThresholdPx) {
        resetPress()
      }
    },
    [moveThresholdPx, resetPress],
  )

  const finishPointer = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (pointerIdRef.current !== event.pointerId) {
        return
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      resetPress()
    },
    [resetPress],
  )

  const onClickCapture = React.useCallback((event: React.MouseEvent) => {
    if (!didLongPressRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    didLongPressRef.current = false
  }, [])

  React.useEffect(() => () => clearTimer(), [clearTimer])

  return {
    isPressing,
    longPressHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishPointer,
      onPointerCancel: finishPointer,
      onClickCapture,
    },
  }
}
