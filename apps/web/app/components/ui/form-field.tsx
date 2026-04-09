'use client'

import { Children, cloneElement, isValidElement, useId, useState, type CSSProperties, type ReactNode } from 'react'
import {
  baseInputStyle,
  focusedInputStyle,
  selectStyle,
  textareaStyle,
} from './input-styles'

// ─── FormField ───────────────────────────────────────────────────────────────
// Label + input wrapper with optional error display.

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  color: 'var(--fg)',
  marginBottom: '6px',
}

const errorStyle: CSSProperties = {
  fontSize: '12px',
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  color: 'var(--penalty)',
  marginTop: '4px',
}

type FormFieldControlProps = {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function FormField({
  label,
  error,
  required,
  children,
  className = '',
}: {
  label?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  const fieldId = useId()
  const errorId = error ? `${fieldId}-error` : undefined
  const child = Children.only(children)
  const controlId = isValidElement<FormFieldControlProps>(child)
    ? child.props.id ?? fieldId
    : fieldId
  const control = isValidElement<FormFieldControlProps>(child)
    ? cloneElement(child, {
        id: controlId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': errorId,
      })
    : children

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label htmlFor={controlId} style={labelStyle}>
          {label}
          {required && (
            <span style={{ color: 'var(--penalty)', marginLeft: '2px' }}>*</span>
          )}
        </label>
      )}
      {control}
      {error && <p id={errorId} style={errorStyle}>{error}</p>}
    </div>
  )
}

// ─── FormInput ───────────────────────────────────────────────────────────────
// Text / number / date input with focus tracking.

const errorInputBorder: CSSProperties = {
  borderColor: 'var(--penalty)',
}

export function FormInput({
  label,
  error,
  required,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  name,
  min,
  max,
  step,
  className = '',
}: {
  label?: string
  error?: string
  required?: boolean
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'email' | 'password'
  value?: string | number
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  name?: string
  min?: string | number
  max?: string | number
  step?: string | number
  className?: string
}) {
  const [focused, setFocused] = useState(false)

  const style: CSSProperties = {
    ...baseInputStyle,
    ...(focused ? focusedInputStyle : {}),
    ...(error ? errorInputBorder : {}),
    ...(disabled
      ? { opacity: 0.5, cursor: 'not-allowed' }
      : {}),
  }

  return (
    <FormField label={label} error={error} required={required} className={className}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        required={required}
        style={style}
      />
    </FormField>
  )
}

// ─── FormSelect ──────────────────────────────────────────────────────────────
// Select dropdown with custom chevron arrow.

export function FormSelect({
  label,
  error,
  required,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  name,
  className = '',
}: {
  label?: string
  error?: string
  required?: boolean
  value?: string
  onChange?: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
  name?: string
  className?: string
}) {
  const [focused, setFocused] = useState(false)

  const style: CSSProperties = {
    ...selectStyle,
    ...(focused ? focusedInputStyle : {}),
    ...(error ? errorInputBorder : {}),
    ...(disabled
      ? { opacity: 0.5, cursor: 'not-allowed' }
      : {}),
  }

  return (
    <FormField label={label} error={error} required={required} className={className}>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        required={required}
        style={style}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

// ─── FormTextarea ────────────────────────────────────────────────────────────
// Textarea with focus tracking.

export function FormTextarea({
  label,
  error,
  required,
  value,
  onChange,
  placeholder,
  disabled,
  name,
  rows,
  className = '',
}: {
  label?: string
  error?: string
  required?: boolean
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  name?: string
  rows?: number
  className?: string
}) {
  const [focused, setFocused] = useState(false)

  const style: CSSProperties = {
    ...textareaStyle,
    ...(focused ? focusedInputStyle : {}),
    ...(error ? errorInputBorder : {}),
    ...(rows ? { minHeight: `${rows * 24}px` } : {}),
    ...(disabled
      ? { opacity: 0.5, cursor: 'not-allowed' }
      : {}),
  }

  return (
    <FormField label={label} error={error} required={required} className={className}>
      <textarea
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        style={style}
      />
    </FormField>
  )
}
