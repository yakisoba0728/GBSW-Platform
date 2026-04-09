import type { CSSProperties, ReactNode } from 'react'
import type {
  SharedMileageRuleSummary as MileageRuleSummary,
  SharedMileageType as MileageType,
  SharedSchoolCode as SchoolCode,
} from './shared-types'

export { NoticeBox } from '../ui/notice'

// Re-export design system components for backward compatibility.
// New code should import directly from '../ui/card'.
export { Card, SectionTitle, StatCard } from '../ui/card'

export const KST_TIME_ZONE = 'Asia/Seoul'

export const SCHOOL_OPTIONS: Array<{ value: SchoolCode; label: string }> = [
  { value: 'GBSW', label: '경북소프트웨어마이스터고등학교' },
  { value: 'BYMS', label: '봉양중학교' },
]

export const inputStyle: CSSProperties = {
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  backgroundColor: 'var(--bg)',
  borderColor: 'var(--border)',
  color: 'var(--fg)',
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
    timeZone: KST_TIME_ZONE,
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
      timeZone: KST_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d),
    time: new Intl.DateTimeFormat('ko-KR', {
      timeZone: KST_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
    }).format(d),
  }
}

export function toDateTimeLocalValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const parsedParts = parts.reduce<Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute', string>>>(
    (acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type as 'year' | 'month' | 'day' | 'hour' | 'minute'] = part.value
      }

      return acc
    },
    {},
  )

  if (
    !parsedParts.year ||
    !parsedParts.month ||
    !parsedParts.day ||
    !parsedParts.hour ||
    !parsedParts.minute
  ) {
    return ''
  }

  return `${parsedParts.year}-${parsedParts.month}-${parsedParts.day}T${parsedParts.hour}:${parsedParts.minute}`
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
