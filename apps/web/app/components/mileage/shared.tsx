import type { CSSProperties, ReactNode } from 'react'
import type {
  SharedMileageRuleSummary as MileageRuleSummary,
  SharedMileageType as MileageType,
  SharedSchoolCode as SchoolCode,
} from '../teacher/shared-mileage-types'

export { NoticeBox } from '../ui/notice'

export const SCHOOL_OPTIONS: Array<{ value: SchoolCode; label: string }> = [
  { value: 'GBSW', label: '경북소프트웨어마이스터고등학교' },
  { value: 'BYMS', label: '봉양중학교' },
]

export const inputStyle: CSSProperties = {
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  backgroundColor: 'var(--admin-bg)',
  borderColor: 'var(--admin-border)',
  color: 'var(--admin-text)',
  fontSize: '0.8rem',
}

export function getSchoolLabel(school: SchoolCode) {
  return SCHOOL_OPTIONS.find((option) => option.value === school)?.label ?? school
}

export function getRuleLabel(rule: MileageRuleSummary) {
  return `[${rule.category}] ${rule.name}`
}

export function formatSignedScore(type: MileageType, score: number) {
  return `${type === 'reward' ? '+' : '-'}${score}점`
}

export function formatAwardedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatAwardedAtParts(value: string): {
  date: string
  time: string
} {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { date: value, time: '' }
  return {
    date: new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d),
    time: new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d),
  }
}

export function toDateTimeLocalValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="mb-3 text-[13px] font-semibold"
      style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg)' }}
    >
      {children}
    </h2>
  )
}

export function Badge({
  type,
  children,
}: {
  type: MileageType
  children: ReactNode
}) {
  return <span className={type === 'reward' ? 'badge-reward' : 'badge-penalty'}>{children}</span>
}

export function StatCard({
  label,
  value,
  subValue,
  colorToken = 'default',
}: {
  label: string
  value: string | number
  subValue?: string
  colorToken?: 'green' | 'red' | 'default'
}) {
  const valueColor =
    colorToken === 'green'
      ? 'var(--reward)'
      : colorToken === 'red'
        ? 'var(--penalty)'
        : 'var(--fg)'

  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
    >
      <p
        className="text-[11px] uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fg-muted)' }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold leading-none"
        style={{ fontFamily: 'var(--font-space-grotesk)', color: valueColor }}
      >
        {value}
      </p>
      {subValue && (
        <p
          className="mt-1.5 text-xs"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg-muted)' }}
        >
          {subValue}
        </p>
      )}
    </div>
  )
}

export function FilterRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 rounded-lg border bg-transparent px-2.5 text-xs outline-none transition-colors ${className}`}
      style={{ ...inputStyle, borderColor: 'var(--border)' }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2
          className="text-[13px] font-semibold"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="mt-0.5 text-xs leading-5"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export function ScoreSummaryBar({
  reward,
  penalty,
}: {
  reward: number
  penalty: number
}) {
  const total = reward + penalty

  if (total === 0) {
    return null
  }

  const rewardWidth = total > 0 ? `${(reward / total) * 100}%` : '50%'
  const penaltyWidth = total > 0 ? `${(penalty / total) * 100}%` : '50%'

  return (
    <div>
      <div
        className="flex h-3 overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <div style={{ width: rewardWidth, backgroundColor: 'var(--reward)' }} />
        <div style={{ width: penaltyWidth, backgroundColor: 'var(--penalty)' }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-xs">
        <span
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--reward)' }}
        >
          상점 {reward}점
        </span>
        <span
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--penalty)' }}
        >
          벌점 {penalty}점
        </span>
      </div>
    </div>
  )
}
