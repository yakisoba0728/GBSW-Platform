'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

// ─── TopProgressBar ───────────────────────────────────────────────────────────
interface TopProgressBarProps {
  active: boolean
}

export function TopProgressBar({ active }: TopProgressBarProps) {
  const width = useMotionValue(0)
  const widthPercent = useTransform(width, (v) => `${v}%`)
  const opacity = useMotionValue(0)

  useEffect(() => {
    if (active) {
      opacity.set(1)
      animate(width, 90, { duration: 2, ease: 'easeOut' })
    } else {
      animate(width, 100, { duration: 0.2 }).then(() => {
        animate(opacity, 0, { duration: 0.3 }).then(() => {
          width.set(0)
        })
      })
    }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 2,
        background: 'var(--accent)',
        width: widthPercent,
        opacity,
        zIndex: 9999,
      }}
    />
  )
}
