'use client'

import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { getItemMotion, useMotionPreference } from './motion'

// ─── 공유 리스트 애니메이션 시스템 ────────────────────────────────────────────
// 학생 탭, 교사 탭 등 모든 탭에서 사용 가능한 범용 리스트 UI 컴포넌트.
// globals.css 의 animate-fade-in-up / animate-pulse-soft / anim-delay-* 클래스 활용.

// ─── AnimatedListItem ─────────────────────────────────────────────────────────
// 모바일 카드 · 수직 리스트 아이템용 div 래퍼.
// index에 따라 stagger delay 자동 적용. forwards fill로 최종 opacity:1 유지.
//
// 사용 예:
//   {items.map((item, i) => (
//     <AnimatedListItem key={item.id} index={i} className="rounded-xl border px-4 py-3">
//       ...
//     </AnimatedListItem>
//   ))}

export function AnimatedListItem({
  index,
  children,
  className = '',
  style,
  animated = true,
}: {
  index: number
  children: ReactNode
  className?: string
  style?: CSSProperties
  animated?: boolean
}) {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getItemMotion(prefersReducedMotion, index)
  return (
    <motion.div
      initial={animated ? motionProps.initial : false}
      animate={animated ? motionProps.animate : undefined}
      transition={animated ? motionProps.transition : undefined}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ─── AnimatedTableRow ─────────────────────────────────────────────────────────
// 데스크탑 테이블 <tr> 래퍼. transform: translateY가 <tr>에도 동작함 (현대 브라우저).
// index에 따라 stagger delay 자동 적용.
//
// 사용 예:
//   {items.map((item, i) => (
//     <AnimatedTableRow
//       key={item.id}
//       index={i}
//       className="hover:bg-black/[0.025] transition-colors"
//       style={{ borderBottom: '1px solid var(--admin-border)' }}
//     >
//       <td>...</td>
//     </AnimatedTableRow>
//   ))}

export function AnimatedTableRow({
  index,
  children,
  className = '',
  style,
  onMouseEnter,
  onMouseLeave,
  onClick,
  animated = true,
}: {
  index: number
  children: ReactNode
  className?: string
  style?: CSSProperties
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  animated?: boolean
}) {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getItemMotion(prefersReducedMotion, index)
  return (
    <motion.tr
      initial={animated ? motionProps.initial : false}
      animate={animated ? motionProps.animate : undefined}
      transition={animated ? motionProps.transition : undefined}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {children}
    </motion.tr>
  )
}

// ─── ListSkeleton ─────────────────────────────────────────────────────────────
// 데이터 로딩 중 표시하는 스켈레톤 플레이스홀더.
// shimmer 슬라이드 효과 (좌→우 광택 이동).
//
// 사용 예:
//   {isLoading ? <ListSkeleton count={6} /> : <실제 리스트 />}

export function ListSkeleton({
  count = 5,
  rowHeight = 'h-11',
}: {
  count?: number
  rowHeight?: string
}) {
  return (
    <div className="space-y-2.5 py-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-lg ${rowHeight}`}
          style={{ backgroundColor: 'var(--admin-border)' }}
        >
          <div
            className="absolute inset-0 animate-shimmer"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
          />
        </div>
      ))}
    </div>
  )
}

export function CardListSkeleton({
  count = 3,
  rowHeight = 'h-32',
}: {
  count?: number
  rowHeight?: string
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl border ${rowHeight}`}
          style={{
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border)',
          }}
        >
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
            }}
          />
        </div>
      ))}
    </>
  )
}

// ─── StatCardSkeleton ─────────────────────────────────────────────────────────
// StatCard (teacher-shared.tsx) 와 동일한 치수의 스켈레톤.
// label 11px · value 24px · subValue 12px 높이를 shimmer로 표현.

export function StatCardSkeleton() {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
    >
      <div
        className="relative overflow-hidden rounded-md"
        style={{ height: 11, width: '40%', backgroundColor: 'var(--border)' }}
      >
        <div
          className="absolute inset-0 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
        />
      </div>
      <div
        className="relative mt-2 overflow-hidden rounded-md"
        style={{ height: 24, width: '50%', backgroundColor: 'var(--border)' }}
      >
        <div
          className="absolute inset-0 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
        />
      </div>
      <div
        className="relative mt-1.5 overflow-hidden rounded-md"
        style={{ height: 12, width: '60%', backgroundColor: 'var(--border)' }}
      >
        <div
          className="absolute inset-0 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
        />
      </div>
    </div>
  )
}

// ─── TableRowSkeleton ─────────────────────────────────────────────────────────
// 테이블 <tbody> 안에서 사용하는 <tr> 기반 스켈레톤.
// 각 열 너비를 60%/80%/50% 순환하여 자연스럽게 표현.
//
// 사용 예:
//   <tbody>
//     {isLoading ? <TableRowSkeleton columns={7} count={6} /> : rows.map(...)}
//   </tbody>

const SKELETON_WIDTHS = ['60%', '80%', '50%'] as const

export function TableRowSkeleton({
  columns = 7,
  count = 6,
}: {
  columns?: number
  count?: number
}) {
  return (
    <>
      {Array.from({ length: count }, (_, row) => (
        <tr key={row} style={{ borderBottom: '1px solid var(--admin-border)' }}>
          {Array.from({ length: columns }, (_, col) => (
            <td
              key={col}
              className="py-2 pr-3"
              style={col === 0 ? { paddingLeft: '10px' } : undefined}
            >
              <div
                className="relative overflow-hidden rounded-md"
                style={{
                  height: '14px',
                  width: SKELETON_WIDTHS[(row + col) % 3],
                  backgroundColor: 'var(--admin-border)',
                }}
              >
                <div
                  className="absolute inset-0 animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
                />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
// 섹션·모달 로딩 중 중앙 표시하는 스피너.
//
// 사용 예:
//   {isLoading && <LoadingSpinner />}
//   {isLoading && <LoadingSpinner size="sm" />}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 16 : size === 'lg' ? 36 : 24
  return (
    <div className="flex items-center justify-center py-6">
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="animate-spin"
        style={{ color: 'var(--admin-accent)' }}
        aria-label="로딩 중"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  )
}

// ─── ListEmptyState ───────────────────────────────────────────────────────────
// 데이터 없을 때 표시하는 빈 상태 UI.
//
// 사용 예:
//   <ListEmptyState
//     icon={<SearchIcon />}
//     title="조회 결과가 없습니다"
//     description="필터 조건을 변경해 보세요."
//   />

export function ListEmptyState({
  icon,
  title,
  description,
  fill = false,
  iconContained = false,
  className = '',
}: {
  icon?: ReactNode
  title: string
  description?: string
  fill?: boolean
  iconContained?: boolean
  className?: string
}) {
  const baseClassName = fill
    ? 'flex h-full min-h-full w-full flex-1 flex-col items-center justify-center gap-3 py-6 text-center'
    : 'flex min-h-[220px] w-full flex-col items-center justify-center gap-3 py-10 text-center'

  return (
    <div
      className={`${baseClassName} ${className}`.trim()}
    >
      {icon &&
        (iconContained ? (
          icon
        ) : (
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--accent-subtle)' }}
          >
            {icon}
          </div>
        ))}
      <div>
        <p
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}
        >
          {title}
        </p>
        {description && (
          <p
            className="mt-1 text-xs"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export function EmptyStatePane({
  className = '',
  ...props
}: {
  icon?: ReactNode
  title: string
  description?: string
  iconContained?: boolean
  className?: string
}) {
  return (
    <div className={`flex min-h-[240px] flex-1 ${className}`.trim()}>
      <ListEmptyState fill {...props} />
    </div>
  )
}
