'use client'

import type { CSSProperties, ReactNode } from 'react'

// ─── Card ────────────────────────────────────────────────────────────────────
// Wrapper div with consistent border, borderRadius, background.
// Extracted from mileage/shared.tsx Card component.

type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const PADDING_MAP: Record<CardPadding, string> = {
  none: '0',
  sm: '12px',
  md: '20px',
  lg: '24px',
}

export function Card({
  children,
  padding = 'md',
  className = '',
  style,
}: {
  children: ReactNode
  padding?: CardPadding
  className?: string
  style?: CSSProperties
}) {
  const baseStyle: CSSProperties = {
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: PADDING_MAP[padding],
    ...style,
  }

  return (
    <div className={className} style={baseStyle}>
      {children}
    </div>
  )
}

// ─── SectionTitle ────────────────────────────────────────────────────────────
// Consistent section heading. Matches mileage/shared.tsx SectionTitle.

export function SectionTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const style: CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
    color: 'var(--fg)',
    marginBottom: '12px',
  }

  return (
    <h3 className={className} style={style}>
      {children}
    </h3>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────
// Label + big value + optional sub text. Uses Card internally.
// Extracted from mileage/shared.tsx StatCard component.

type StatColorToken = 'green' | 'red' | 'default'

function getValueColor(colorToken: StatColorToken): string {
  switch (colorToken) {
    case 'green':
      return 'var(--reward)'
    case 'red':
      return 'var(--penalty)'
    default:
      return 'var(--fg)'
  }
}

export function StatCard({
  label,
  value,
  subValue,
  colorToken = 'default',
  className = '',
}: {
  label: string
  value: string | number
  subValue?: string
  colorToken?: StatColorToken
  className?: string
}) {
  const labelStyle: CSSProperties = {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-space-grotesk)',
    color: 'var(--fg-muted)',
  }

  const valueStyle: CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: 1,
    marginTop: '8px',
    fontFamily: 'var(--font-space-grotesk)',
    color: getValueColor(colorToken),
  }

  const subValueStyle: CSSProperties = {
    fontSize: '12px',
    marginTop: '6px',
    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
    color: 'var(--fg-muted)',
  }

  return (
    <Card padding="sm" className={className} style={{ padding: '16px' }}>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{value}</p>
      {subValue && <p style={subValueStyle}>{subValue}</p>}
    </Card>
  )
}
