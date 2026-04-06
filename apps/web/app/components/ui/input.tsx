'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ChangeEvent, CSSProperties } from 'react'
import { useState } from 'react'

// ─── Shared base input styles ─────────────────────────────────────────────────

const inputBase: CSSProperties = {
  width: '100%',
  height: '38px',
  padding: '0 12px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--bg)',
  color: 'var(--fg)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
  appearance: 'none',
}

const labelStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--fg)',
  display: 'block',
}

const errorMessageStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--penalty)',
  marginTop: '2px',
}

// ─── Error message animation ──────────────────────────────────────────────────

function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.p
      key="error"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      style={errorMessageStyle}
    >
      {message}
    </motion.p>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Input({
  label,
  error,
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  className = '',
  id,
  name,
  autoComplete,
  required = false,
}: {
  label?: string
  error?: string
  placeholder?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  autoComplete?: string
  required?: boolean
}) {
  const [focused, setFocused] = useState(false)

  const computedStyle: CSSProperties = {
    ...inputBase,
    ...(disabled
      ? {
          opacity: 0.5,
          cursor: 'not-allowed',
          background: 'var(--bg-muted)',
        }
      : {}),
    ...(error
      ? {
          borderColor: 'var(--penalty)',
          boxShadow: focused ? '0 0 0 3px var(--penalty-subtle)' : 'none',
        }
      : focused
        ? {
            borderColor: 'var(--accent)',
            boxShadow: '0 0 0 3px var(--accent-subtle)',
          }
        : {}),
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
    >
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
          {required && (
            <span style={{ color: 'var(--penalty)', marginLeft: '3px' }}>*</span>
          )}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autoComplete}
        required={required}
        style={computedStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <AnimatePresence>
        {error && <ErrorMessage message={error} />}
      </AnimatePresence>
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

export function Select({
  label,
  error,
  options,
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder,
}: {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)

  const computedStyle: CSSProperties = {
    ...inputBase,
    paddingRight: '32px', // space for the custom arrow
    ...(disabled
      ? {
          opacity: 0.5,
          cursor: 'not-allowed',
          background: 'var(--bg-muted)',
        }
      : {}),
    ...(error
      ? {
          borderColor: 'var(--penalty)',
          boxShadow: focused ? '0 0 0 3px var(--penalty-subtle)' : 'none',
        }
      : focused
        ? {
            borderColor: 'var(--accent)',
            boxShadow: '0 0 0 3px var(--accent-subtle)',
          }
        : {}),
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
    >
      {label && (
        <label style={labelStyle}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={computedStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <span
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--fg-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-hidden="true"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      <AnimatePresence>
        {error && <ErrorMessage message={error} />}
      </AnimatePresence>
    </div>
  )
}

// ─── SearchInput ──────────────────────────────────────────────────────────────

export function SearchInput({
  placeholder = '검색',
  value,
  onChange,
  onClear,
  className = '',
}: {
  placeholder?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  className?: string
}) {
  const [focused, setFocused] = useState(false)

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  }

  const fieldStyle: CSSProperties = {
    ...inputBase,
    paddingLeft: '36px',
    paddingRight: value ? '36px' : '12px',
    ...(focused
      ? {
          borderColor: 'var(--accent)',
          boxShadow: '0 0 0 3px var(--accent-subtle)',
        }
      : {}),
  }

  const iconWrapStyle: CSSProperties = {
    position: 'absolute',
    left: '10px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    color: 'var(--fg-muted)',
  }

  const clearBtnStyle: CSSProperties = {
    position: 'absolute',
    right: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: 'none',
    background: 'var(--bg-muted)',
    color: 'var(--fg-muted)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  }

  return (
    <div className={className} style={wrapperStyle}>
      {/* Search icon */}
      <span style={iconWrapStyle} aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={fieldStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {/* Clear button */}
      <AnimatePresence>
        {value && (
          <motion.button
            key="clear"
            type="button"
            aria-label="검색어 지우기"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            whileTap={{ scale: 0.85 }}
            style={clearBtnStyle}
            onClick={() => {
              if (onClear) {
                onClear()
              }
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
