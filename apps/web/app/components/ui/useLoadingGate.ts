'use client'

import { useState, useEffect, useRef } from 'react'

export function useLoadingGate({
  active,
  initialVisible = active,
  delayMs = 150,
  minVisibleMs = 240,
}: {
  active: boolean
  initialVisible?: boolean
  delayMs?: number
  minVisibleMs?: number
}) {
  const [visible, setVisible] = useState(initialVisible)
  const visibleAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (visible && visibleAtRef.current === null) {
      visibleAtRef.current = Date.now()
    }
  }, [visible])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null

    if (active) {
      if (!visible) {
        timeout = setTimeout(() => {
          setVisible(true)
          visibleAtRef.current = Date.now()
        }, delayMs)
      }
    } else {
      if (visible) {
        const timeVisible = Date.now() - (visibleAtRef.current || 0)
        const timeRemaining = Math.max(0, minVisibleMs - timeVisible)
        timeout = setTimeout(() => {
          setVisible(false)
          visibleAtRef.current = null
        }, timeRemaining)
      }
    }

    return () => {
      if (timeout !== null) {
        clearTimeout(timeout)
      }
    }
  }, [active, delayMs, minVisibleMs, visible])

  return visible
}
