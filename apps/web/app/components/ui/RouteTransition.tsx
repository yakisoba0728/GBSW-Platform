'use client'

import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { dispatchAppNavigationComplete } from '@/lib/url-state'
import { getPageMotion, useMotionPreference } from './motion'

export default function RouteTransition({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
}) {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getPageMotion(prefersReducedMotion, delay)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      dispatchAppNavigationComplete()
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <motion.div
      initial={motionProps.initial}
      animate={motionProps.animate}
      exit={motionProps.exit}
      transition={motionProps.transition}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}
