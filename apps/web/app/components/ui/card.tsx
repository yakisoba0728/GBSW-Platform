'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps {
  children?: ReactNode
  hover?: boolean
  padding?: CardPadding
  className?: string
  onClick?: () => void
}

interface CardHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

interface CardBodyProps {
  children?: ReactNode
  className?: string
}

const paddingMap: Record<CardPadding, string> = {
  none: '0px',
  sm: '12px',
  md: '20px',
  lg: '28px',
}

const cardBaseStyle: React.CSSProperties = {
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  transition: 'box-shadow 0.2s ease',
}

export function Card({
  children,
  hover = false,
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const style: React.CSSProperties = {
    ...cardBaseStyle,
    padding: paddingMap[padding],
  }

  if (hover) {
    return (
      <motion.div
        className={className}
        style={{ ...style, cursor: 'pointer' }}
        onClick={onClick}
        whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        whileTap={{ scale: 0.99 }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={className} style={style} onClick={onClick}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className = '',
}: CardHeaderProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--fg)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </span>
        {description && (
          <span
            style={{
              fontSize: '13px',
              color: 'var(--fg-muted)',
              marginTop: '2px',
              lineHeight: 1.4,
            }}
          >
            {description}
          </span>
        )}
      </div>
      {action && (
        <div style={{ flexShrink: 0, marginLeft: '12px' }}>{action}</div>
      )}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={className}>{children}</div>
}
