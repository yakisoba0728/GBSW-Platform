import type { CSSProperties } from 'react'

export const baseInputStyle: CSSProperties = {
  width: '100%',
  height: '40px',
  padding: '0 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg)',
  color: 'var(--fg)',
  fontSize: '14px',
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

export const focusedInputStyle: CSSProperties = {
  borderColor: 'var(--accent)',
  boxShadow: '0 0 0 2px var(--accent-subtle)',
}

export function getActiveInputStyle(isFocused: boolean): CSSProperties {
  return isFocused ? { ...baseInputStyle, ...focusedInputStyle } : baseInputStyle
}

export const selectStyle: CSSProperties = {
  ...baseInputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}

export const textareaStyle: CSSProperties = {
  ...baseInputStyle,
  height: 'auto',
  minHeight: '80px',
  padding: '10px 12px',
  resize: 'vertical' as const,
}
