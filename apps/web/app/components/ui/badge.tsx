import type { ReactNode } from 'react'

type BadgeVariant = 'reward' | 'penalty' | 'neutral' | 'info' | 'warning'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant: BadgeVariant
  children?: ReactNode
  className?: string
  size?: BadgeSize
}

interface MileageBadgeProps {
  type: 'reward' | 'penalty'
  points: number
}

function getVariantStyle(variant: BadgeVariant): React.CSSProperties {
  switch (variant) {
    case 'reward':
      return {
        background: 'var(--reward-subtle)',
        color: 'var(--reward)',
        border: '1px solid var(--reward-border)',
      }
    case 'penalty':
      return {
        background: 'var(--penalty-subtle)',
        color: 'var(--penalty)',
        border: '1px solid var(--penalty-border)',
      }
    case 'neutral':
      return {
        background: 'var(--bg-muted)',
        color: 'var(--fg-muted)',
        border: '1px solid var(--border)',
      }
    case 'info':
      return {
        background: 'var(--accent-subtle)',
        color: 'var(--accent)',
        border: '1px solid var(--accent-border)',
      }
    case 'warning':
      return {
        background: '#fffbeb',
        color: '#92400e',
        border: '1px solid rgba(180, 120, 0, 0.25)',
      }
  }
}

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: {
    fontSize: '11px',
    padding: '1px 7px',
    borderRadius: '4px',
    fontWeight: 700,
  },
  md: {
    fontSize: '12px',
    padding: '2px 10px',
    borderRadius: '5px',
    fontWeight: 600,
  },
}

export function Badge({
  variant,
  children,
  className = '',
  size = 'sm',
}: BadgeProps) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 1.4,
    ...sizeStyles[size],
    ...getVariantStyle(variant),
  }

  return (
    <span className={className} style={style}>
      {children}
    </span>
  )
}

export function MileageBadge({ type, points }: MileageBadgeProps) {
  const label = type === 'reward' ? `+${points}점` : `-${points}점`
  return <Badge variant={type}>{label}</Badge>
}
