'use client'

import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  children?: ReactNode
  type?: 'button' | 'submit' | 'reset'
  className?: string
  icon?: ReactNode
  fullWidth?: boolean
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '28px', padding: '0 10px', fontSize: '12px' },
  md: { height: '36px', padding: '0 16px', fontSize: '14px' },
  lg: { height: '42px', padding: '0 20px', fontSize: '15px' },
}

function getVariantStyle(variant: ButtonVariant, hovered: boolean): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background: 'var(--accent)',
        color: '#ffffff',
        border: 'none',
        filter: hovered ? 'brightness(0.9)' : 'brightness(1)',
      }
    case 'secondary':
      return {
        background: hovered ? 'var(--bg-muted)' : 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--fg)',
      }
    case 'ghost':
      return {
        background: hovered ? 'var(--bg-muted)' : 'transparent',
        border: 'none',
        color: hovered ? 'var(--fg)' : 'var(--fg-muted)',
      }
    case 'danger':
      return {
        background: hovered ? 'var(--penalty-subtle)' : 'transparent',
        border: '1px solid var(--penalty-border)',
        color: 'var(--penalty)',
      }
    case 'accent':
      return {
        background: hovered ? 'var(--accent)' : 'var(--accent-subtle)',
        border: '1px solid var(--accent)',
        color: hovered ? '#ffffff' : 'var(--accent)',
      }
  }
}

function LoadingSpinner() {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </motion.svg>
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  className = '',
  icon,
  fullWidth = false,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false)
  const isInert = disabled || loading

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: '8px',
    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
    fontWeight: 500,
    lineHeight: 1,
    cursor: isInert ? 'not-allowed' : 'pointer',
    opacity: isInert ? 0.5 : 1,
    transition: 'background 0.15s ease, filter 0.15s ease, color 0.15s ease',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    outline: 'none',
    ...(fullWidth ? { width: '100%' } : {}),
    ...sizeStyles[size],
    ...getVariantStyle(variant, hovered && !isInert),
  }

  const iconEl = icon ? (
    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
      {icon}
    </span>
  ) : null

  if (isInert) {
    return (
      <button
        type={type}
        disabled
        className={className}
        style={baseStyle}
        aria-busy={loading}
      >
        {loading && <LoadingSpinner />}
        {!loading && iconEl}
        {!loading && children}
      </button>
    )
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={className}
      style={baseStyle}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {loading && <LoadingSpinner />}
      {!loading && iconEl}
      {children}
    </motion.button>
  )
}
