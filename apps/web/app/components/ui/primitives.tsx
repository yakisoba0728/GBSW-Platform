'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { MileageType } from '../teacher/school-mileage-types'
import { formatSignedScore } from '../mileage/shared'

// ─── MileageBadge ─────────────────────────────────────────────────────────────

export function MileageBadge({
  type,
  score,
  className = '',
}: {
  type: MileageType
  score: number
  className?: string
}) {
  return (
    <span className={`${type === 'reward' ? 'badge-reward' : 'badge-penalty'} ${className}`}>
      {formatSignedScore(type, score)}
    </span>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const dim = size === 'xs' ? 12 : size === 'sm' ? 14 : 18
  return (
    <Loader2
      size={dim}
      className="animate-spin flex-shrink-0"
      style={{ color: 'var(--admin-accent)' }}
      aria-hidden="true"
    />
  )
}

// ─── FetchingOverlay ──────────────────────────────────────────────────────────

export function FetchingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center animate-fade-in">
      <div
        className="flex items-center gap-2 rounded-md border px-3 py-1.5"
        style={{
          backgroundColor: 'var(--admin-sidebar-bg)',
          borderColor: 'var(--admin-border)',
        }}
      >
        <Spinner size="sm" />
        <span
          className="text-xs"
          style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
        >
          조회 중
        </span>
      </div>
    </div>
  )
}

// ─── RefetchWrapper ──────────────────────────────────────────────────────────
// 데이터 리페치 시 기존 콘텐츠 위에 오버레이를 표시하는 래퍼.
// isInitialLoad=true 이면 children을 렌더링하지 않음 (호출자가 스켈레톤 처리).

export function RefetchWrapper({
  isFetching,
  isInitialLoad,
  children,
  className = '',
  contentClassName = '',
}: {
  isFetching: boolean
  isInitialLoad: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  if (isInitialLoad) return null

  return (
    <div className={`relative ${className}`.trim()}>
      <div
        className={contentClassName}
        style={{
          opacity: isFetching ? 0.35 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        {children}
      </div>
      <FetchingOverlay visible={isFetching} />
    </div>
  )
}

// ─── IconButton ───────────────────────────────────────────────────────────────

export function IconButton({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  icon: ReactNode
  label: string
  onClick?: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={variant === 'danger' ? 'icon-btn-danger' : 'icon-btn'}
    >
      {icon}
    </button>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({
  page,
  pageCount,
  totalCount,
  onChange,
}: {
  page: number
  pageCount: number
  totalCount?: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1 && !totalCount) return null

  const visibleCount = Math.min(pageCount, 5)
  const pages = Array.from({ length: visibleCount }, (_, i) => {
    if (pageCount <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= pageCount - 2) return pageCount - 4 + i
    return page - 2 + i
  })

  return (
    <div className="flex flex-shrink-0 items-center justify-between gap-3 pt-3">
      {totalCount !== undefined ? (
        <p
          className="text-xs"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
        >
          총{' '}
          <span style={{ color: 'var(--admin-text)', fontWeight: 600, fontFamily: 'var(--font-space-grotesk)' }}>
            {totalCount.toLocaleString()}
          </span>
          건
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="icon-btn disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="이전 페이지"
        >
          <ChevronLeft size={12} strokeWidth={2.5} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-0.5">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className="flex h-7 min-w-[28px] items-center justify-center rounded-md border px-1 text-xs font-medium transition-colors"
              style={
                p === page
                  ? {
                      backgroundColor: 'var(--admin-accent)',
                      color: '#fff',
                      borderColor: 'var(--admin-accent)',
                      fontFamily: 'var(--font-space-grotesk)',
                    }
                  : {
                      color: 'var(--admin-text-muted)',
                      borderColor: 'var(--admin-border)',
                      fontFamily: 'var(--font-space-grotesk)',
                    }
              }
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="icon-btn disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="다음 페이지"
        >
          <ChevronRight size={12} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
