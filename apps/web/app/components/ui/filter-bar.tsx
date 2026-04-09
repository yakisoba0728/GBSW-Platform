'use client'

import type { CSSProperties, ReactNode } from 'react'
import { baseInputStyle, selectStyle } from './input-styles'
import { Button } from './button'

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterSelectDefinition = {
  type: 'select'
  key: string
  label?: string
  placeholder?: string
  options: Array<{ value: string; label: string }>
  width?: number | string
}

type FilterDateDefinition = {
  type: 'date'
  key: string
  label?: string
  placeholder?: string
  width?: number | string
}

type FilterTextDefinition = {
  type: 'text'
  key: string
  label?: string
  placeholder?: string
  width?: number | string
}

export type FilterDefinition =
  | FilterSelectDefinition
  | FilterDateDefinition
  | FilterTextDefinition

type FilterBarProps = {
  filters: FilterDefinition[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onReset?: () => void
  actions?: ReactNode
  className?: string
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: '8px',
}

const fieldWrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const filterLabelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  color: 'var(--fg-muted)',
}

const compactInputStyle: CSSProperties = {
  ...baseInputStyle,
  height: '36px',
  fontSize: '13px',
}

const compactSelectStyle: CSSProperties = {
  ...selectStyle,
  height: '36px',
  fontSize: '13px',
}

// ─── FilterBar ───────────────────────────────────────────────────────────────
// Reusable filter controls row with select, date, and text filter types.

export function FilterBar({
  filters,
  values,
  onChange,
  onReset,
  actions,
  className = '',
}: FilterBarProps) {
  return (
    <div className={className} style={containerStyle}>
      {filters.map((filter) => {
        const fieldWidth = filter.width ?? 'auto'

        return (
          <div
            key={filter.key}
            style={{
              ...fieldWrapperStyle,
              width: typeof fieldWidth === 'number' ? `${fieldWidth}px` : fieldWidth,
              minWidth: typeof fieldWidth === 'number' ? `${fieldWidth}px` : undefined,
            }}
          >
            {filter.label && <span style={filterLabelStyle}>{filter.label}</span>}

            {filter.type === 'select' && (
              <select
                value={values[filter.key] ?? ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                style={compactSelectStyle}
              >
                {filter.placeholder && (
                  <option value="">{filter.placeholder}</option>
                )}
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {filter.type === 'date' && (
              <input
                type="date"
                value={values[filter.key] ?? ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                style={compactInputStyle}
              />
            )}

            {filter.type === 'text' && (
              <input
                type="text"
                value={values[filter.key] ?? ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                style={compactInputStyle}
              />
            )}
          </div>
        )
      })}

      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          초기화
        </Button>
      )}

      {actions && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          {actions}
        </div>
      )}
    </div>
  )
}
