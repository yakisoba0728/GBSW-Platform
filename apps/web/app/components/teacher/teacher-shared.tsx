'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { MileageType, SchoolCode, SchoolMileageRuleSummary } from './school-mileage-types'

// NoticeBox는 components/ui/notice.tsx 로 이동됨. 기존 import 호환을 위해 re-export.
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
      style={{
        backgroundColor: 'var(--admin-sidebar-bg)',
        borderColor: 'var(--admin-border)',
      }}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-sm font-semibold mb-4"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        color: 'var(--admin-text)',
      }}
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
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        backgroundColor:
          type === 'reward' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        color: type === 'reward' ? '#16a34a' : '#dc2626',
      }}
    >
      {children}
    </span>
  )
}

export function getSchoolLabel(school: SchoolCode) {
  return (
    SCHOOL_OPTIONS.find((option) => option.value === school)?.label ?? school
  )
}

export function getRuleLabel(rule: SchoolMileageRuleSummary) {
  return `[${rule.category}] ${rule.name}`
}

export function formatSignedScore(type: MileageType, score: number) {
  return `${type === 'reward' ? '+' : '-'}${score}점`
}

export function formatAwardedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatAwardedAtParts(value: string): { date: string; time: string } {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { date: value, time: '' }
  return {
    date: new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d),
    time: new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(d),
  }
}

export function toDateTimeLocalValue(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)

  return localDate.toISOString().slice(0, 16)
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

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
      ? '#16a34a'
      : colorToken === 'red'
        ? '#dc2626'
        : 'var(--admin-text)'

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: 'var(--admin-sidebar-bg)',
        borderColor: 'var(--admin-border)',
      }}
    >
      <p
        className="text-xs"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--admin-text-muted)',
        }}
      >
        {label}
      </p>
      <p
        className="mt-1.5 text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-space-grotesk)', color: valueColor }}
      >
        {value}
      </p>
      {subValue && (
        <p
          className="mt-0.5 text-xs"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--admin-text-muted)',
          }}
        >
          {subValue}
        </p>
      )}
    </div>
  )
}

// ─── FilterRow ────────────────────────────────────────────────────────────────

export function FilterRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

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
          className="text-sm font-semibold"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--admin-text)',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="mt-0.5 text-xs leading-5"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── ScoreSummaryBar ──────────────────────────────────────────────────────────

export function ScoreSummaryBar({
  reward,
  penalty,
}: {
  reward: number
  penalty: number
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
    return () => cancelAnimationFrame(t)
  }, [reward, penalty])

  const total = reward + penalty
  const rewardPct = total > 0 ? Math.round((reward / total) * 100) : 0
  const penaltyPct = total > 0 ? 100 - rewardPct : 0

  if (total === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
        <span style={{ color: '#16a34a' }}>상점 {rewardPct}%</span>
        <span style={{ color: '#dc2626' }}>벌점 {penaltyPct}%</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--admin-border)' }}>
        <div
          className="h-full rounded-l-full"
          style={{
            width: mounted ? `${rewardPct}%` : '0%',
            backgroundColor: '#16a34a',
            transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
        <div
          className="h-full rounded-r-full"
          style={{
            width: mounted ? `${penaltyPct}%` : '0%',
            backgroundColor: '#dc2626',
            transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <div className="flex justify-between text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-space-grotesk)' }}>
        <span>+{reward}점</span>
        <span>-{penalty}점</span>
      </div>
    </div>
  )
}
