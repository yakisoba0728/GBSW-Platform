'use client'

import { motion } from 'framer-motion'
import { useState, type FocusEvent, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'outline' | 'destructive'
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
  sm: { height: '32px', padding: '0 12px', fontSize: '12px' },
  md: { height: '40px', padding: '0 18px', fontSize: '14px' },
  lg: { height: '48px', padding: '0 24px', fontSize: '15px' },
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
    case 'outline':
      return {
        background: hovered ? 'var(--bg-muted)' : 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--fg)',
      }
    case 'destructive':
      return {
        background: hovered ? 'var(--penalty-subtle)' : 'transparent',
        border: '1px solid var(--penalty-border)',
        color: 'var(--penalty)',
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
  const [focusVisible, setFocusVisible] = useState(false)
  const isInert = disabled || loading

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: '8px',
    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
    fontWeight: 500,
    lineHeight: 1.2,
    cursor: isInert ? 'not-allowed' : 'pointer',
    opacity: isInert ? 0.5 : 1,
    transition: 'background 0.15s ease, filter 0.15s ease, color 0.15s ease',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    outline: 'none',
    boxShadow: focusVisible ? '0 0 0 3px rgba(var(--accent-rgb), 0.28)' : 'none',
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
        onFocus={(event: FocusEvent<HTMLButtonElement>) => setFocusVisible(event.currentTarget.matches(':focus-visible'))}
        onBlur={() => setFocusVisible(false)}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            visibility: loading ? 'hidden' : 'visible',
          }}
        >
          {iconEl}
          {children}
        </span>
        {loading && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <LoadingSpinner />
          </span>
        )}
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
      onFocus={(event) => setFocusVisible(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocusVisible(false)}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          visibility: loading ? 'hidden' : 'visible',
        }}
      >
        {iconEl}
        {children}
      </span>
      {loading && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <LoadingSpinner />
        </span>
      )}
    </motion.button>
  )
}
