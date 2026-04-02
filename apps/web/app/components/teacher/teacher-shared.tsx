'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { MileageType, SchoolCode, SchoolMileageRuleSummary } from './school-mileage-types'
import { ModalBase } from '../ui/modal'

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

// ─── 한글 검색 유틸 ───────────────────────────────────────────────────────────

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const

function getChoseong(char: string) {
  const code = char.charCodeAt(0) - 0xac00
  if (code < 0 || code > 11171) return char
  return CHOSEONG[Math.floor(code / 588)]
}

export function koreanIncludes(text: string, query: string) {
  const q = query.trim()
  if (!q) return true
  if (text.includes(q)) return true

  const tc = Array.from(text)
  const qc = Array.from(q)

  outer: for (let i = 0; i <= tc.length - qc.length; i++) {
    for (let j = 0; j < qc.length; j++) {
      const qi = qc[j]
      const ti = tc[i + j]
      if (/^[ㄱ-ㅎ]$/.test(qi)) {
        if (getChoseong(ti) !== qi) continue outer
        continue
      }
      if (ti !== qi) continue outer
    }
    return true
  }
  return false
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

// ─── RuleSelectionModal (공유) ────────────────────────────────────────────────

export function RuleSelectionModal({
  isOpen,
  rewardRules,
  penaltyRules,
  currentRuleId,
  onSelect,
  onClose,
}: {
  isOpen: boolean
  rewardRules: SchoolMileageRuleSummary[]
  penaltyRules: SchoolMileageRuleSummary[]
  currentRuleId: number | ''
  onSelect: (rule: SchoolMileageRuleSummary) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => searchRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const filteredReward = useMemo(
    () => rewardRules.filter((r) => !search || koreanIncludes(r.name, search) || koreanIncludes(r.category, search)),
    [rewardRules, search],
  )
  const filteredPenalty = useMemo(
    () => penaltyRules.filter((r) => !search || koreanIncludes(r.name, search) || koreanIncludes(r.category, search)),
    [penaltyRules, search],
  )

  const hasResults = filteredReward.length > 0 || filteredPenalty.length > 0

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div
        className="flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border"
        style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
              상벌점 항목 선택
            </p>
            <p className="mt-0.5 text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
              항목을 선택하면 기본 점수가 자동 적용됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--admin-text-muted)' }}
            aria-label="닫기"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 검색 */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ color: 'var(--admin-text-muted)' }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="항목명 또는 카테고리 검색"
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!hasResults ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--admin-text-muted)' }} aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                검색 결과가 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReward.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#16a34a' }} />
                    <p className="text-[11px] font-semibold tracking-wide" style={{ color: '#16a34a', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      상점 ({filteredReward.length})
                    </p>
                  </div>
                  <div className="space-y-1">
                    {filteredReward.map((rule) => {
                      const isSelected = currentRuleId === rule.id
                      return (
                        <button
                          key={rule.id}
                          type="button"
                          onClick={() => { onSelect(rule); onClose() }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                          style={{
                            backgroundColor: isSelected ? 'rgba(34,197,94,0.08)' : 'transparent',
                            borderWidth: 1, borderStyle: 'solid',
                            borderColor: isSelected ? 'rgba(34,197,94,0.3)' : 'transparent',
                          }}
                        >
                          <span
                            className="w-[52px] flex-shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-bold"
                            style={{
                              backgroundColor: 'rgba(34,197,94,0.15)',
                              color: '#15803d',
                              border: '1px solid rgba(34,197,94,0.3)',
                              fontFamily: 'var(--font-space-grotesk)',
                            }}
                          >
                            +{rule.defaultScore}점
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                              {rule.name}
                            </span>
                            <span className="block text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                              {rule.category}
                            </span>
                          </span>
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {filteredPenalty.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#dc2626' }} />
                    <p className="text-[11px] font-semibold tracking-wide" style={{ color: '#dc2626', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      벌점 ({filteredPenalty.length})
                    </p>
                  </div>
                  <div className="space-y-1">
                    {filteredPenalty.map((rule) => {
                      const isSelected = currentRuleId === rule.id
                      return (
                        <button
                          key={rule.id}
                          type="button"
                          onClick={() => { onSelect(rule); onClose() }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                          style={{
                            backgroundColor: isSelected ? 'rgba(239,68,68,0.08)' : 'transparent',
                            borderWidth: 1, borderStyle: 'solid',
                            borderColor: isSelected ? 'rgba(239,68,68,0.3)' : 'transparent',
                          }}
                        >
                          <span
                            className="w-[52px] flex-shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-bold"
                            style={{
                              backgroundColor: 'rgba(239,68,68,0.15)',
                              color: '#b91c1c',
                              border: '1px solid rgba(239,68,68,0.3)',
                              fontFamily: 'var(--font-space-grotesk)',
                            }}
                          >
                            -{rule.defaultScore}점
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                              {rule.name}
                            </span>
                            <span className="block text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                              {rule.category}
                            </span>
                          </span>
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  )
}
