'use client'

import { motion } from 'framer-motion'

// ─── InlineSpinner ────────────────────────────────────────────────────────────
interface InlineSpinnerProps {
  className?: string
}

export function InlineSpinner({ className }: InlineSpinnerProps) {
  return (
    <motion.div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
      aria-hidden="true"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="28 8"
        />
      </svg>
    </motion.div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
type SpinnerSize = 'sm' | 'md' | 'lg'

const sizePx: Record<SpinnerSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
}

interface SpinnerProps {
  size?: SpinnerSize
  color?: string
  className?: string
}

export function Spinner({ size = 'md', color = 'var(--accent)', className }: SpinnerProps) {
  const px = sizePx[size]
  const strokeWidth = size === 'sm' ? 2 : size === 'md' ? 2.5 : 3
  // Circumference for an inner radius that leaves a gap: r = (px/2) - strokeWidth/2 - 2
  const r = px / 2 - strokeWidth / 2 - 2
  const circumference = 2 * Math.PI * r
  const dashArray = `${(circumference * 0.75).toFixed(1)} ${(circumference * 0.25).toFixed(1)}`

  return (
    <motion.div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      aria-hidden="true"
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
        />
      </svg>
    </motion.div>
  )
}

// ─── PageLoader ───────────────────────────────────────────────────────────────
interface PageLoaderProps {
  label?: string
}

export function PageLoader({ label = '불러오는 중...' }: PageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: '12px',
      }}
      aria-label={label}
      role="status"
    >
      <Spinner size="md" />
      <span
        style={{
          fontSize: '13px',
          color: 'var(--fg-muted)',
          marginTop: 0,
        }}
      >
        {label}
      </span>
    </motion.div>
  )
}
