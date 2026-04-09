'use client'

import type { CSSProperties, ReactNode } from 'react'

// ─── Badge ───────────────────────────────────────────────────────────────────
// Generic badge with color variants. Uses inline CSSProperties + CSS variables.

type BadgeVariant = 'reward' | 'penalty' | 'neutral' | 'info'

function getBadgeStyle(variant: BadgeVariant): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
    lineHeight: 1.5,
    whiteSpace: 'nowrap',
  }

  switch (variant) {
    case 'reward':
      return {
        ...base,
        backgroundColor: 'var(--reward-subtle)',
        color: 'var(--reward)',
        border: '1px solid var(--reward-border)',
      }
    case 'penalty':
      return {
        ...base,
        backgroundColor: 'var(--penalty-subtle)',
        color: 'var(--penalty)',
        border: '1px solid var(--penalty-border)',
      }
    case 'neutral':
      return {
        ...base,
        backgroundColor: 'var(--bg-muted)',
        color: 'var(--fg-muted)',
        border: '1px solid var(--border)',
      }
    case 'info':
      return {
        ...base,
        backgroundColor: 'var(--accent-subtle)',
        color: 'var(--accent)',
        border: '1px solid var(--accent)',
      }
  }
}

export function Badge({
  variant = 'neutral',
  children,
  className = '',
}: {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}) {
  return (
    <span className={className} style={getBadgeStyle(variant)}>
      {children}
    </span>
  )
}

// ─── MileageBadge ────────────────────────────────────────────────────────────
// Shows "상점" or "벌점" with appropriate reward/penalty coloring.
// Aligns with existing MileageBadge in primitives.tsx but uses inline styles.

export function MileageBadge({
  type,
  className = '',
}: {
  type: 'reward' | 'penalty'
  className?: string
}) {
  return (
    <Badge variant={type} className={className}>
      {type === 'reward' ? '상점' : '벌점'}
    </Badge>
  )
}

// ─── ScoreBadge ──────────────────────────────────────────────────────────────
// Shows "+5" or "-3" with reward/penalty coloring.
// Uses Space Grotesk font for numeric display.

export function ScoreBadge({
  type,
  score,
  className = '',
}: {
  type: 'reward' | 'penalty'
  score: number
  className?: string
}) {
  const style: CSSProperties = {
    ...getBadgeStyle(type),
    fontFamily: 'var(--font-space-grotesk)',
    fontWeight: 700,
    fontSize: '12px',
    letterSpacing: '-0.01em',
  }

  const prefix = type === 'reward' ? '+' : '-'

  return (
    <span className={className} style={style}>
      {prefix}{score}
    </span>
  )
}
