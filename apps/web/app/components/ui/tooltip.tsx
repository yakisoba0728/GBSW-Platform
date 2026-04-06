'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getTooltipMotion, useMotionPreference } from './motion'

interface TooltipProps {
  content: ReactNode
  children: ReactElement
  maxWidth?: number
  delay?: number
  position?: 'top' | 'bottom'
  disabled?: boolean
}

export default function Tooltip({
  content,
  children,
  maxWidth = 240,
  delay = 300,
  position = 'top',
  disabled = false,
}: TooltipProps) {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getTooltipMotion(prefersReducedMotion)
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<{ x: number; y: number; placement: 'top' | 'bottom' }>({
    x: 0,
    y: 0,
    placement: position,
  })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const GAP = 6

    const spaceAbove = rect.top
    const preferTop = position === 'top' ? spaceAbove > 60 : spaceAbove > window.innerHeight - rect.bottom

    setCoords({
      x: rect.left + rect.width / 2,
      y: preferTop ? rect.top - GAP : rect.bottom + GAP,
      placement: preferTop ? 'top' : 'bottom',
    })
  }, [position])

  const handleEnter = useCallback(() => {
    if (disabled || !content) return
    timerRef.current = setTimeout(() => {
      updatePosition()
      setVisible(true)
    }, delay)
  }, [disabled, content, delay, updatePosition])

  const handleLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const handleScroll = () => {
      updatePosition()
    }
    const handleResize = () => {
      updatePosition()
    }
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [visible, updatePosition])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        style={{ display: 'inline-block', width: '100%', maxWidth: '100%', minWidth: 0 }}
      >
        {children}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {visible && (
              <motion.div
                initial={motionProps.initial}
                animate={motionProps.animate}
                exit={motionProps.exit}
                transition={motionProps.transition}
                style={{
                  position: 'fixed',
                  left: coords.x,
                  top: coords.y,
                  transform: `translateX(-50%) ${coords.placement === 'top' ? 'translateY(-100%)' : 'translateY(0)'}`,
                  zIndex: 9999,
                  maxWidth,
                  padding: '6px 10px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  pointerEvents: 'none',
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                }}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
