'use client'

import type { CSSProperties, ReactNode } from 'react'

// ─── 공유 리스트 애니메이션 시스템 ────────────────────────────────────────────
// 학생 탭, 교사 탭 등 모든 탭에서 사용 가능한 범용 리스트 UI 컴포넌트.
// globals.css 의 animate-fade-in-up / animate-pulse-soft / anim-delay-* 클래스 활용.

// stagger delay 클래스 (globals.css 에 정의됨)
const STAGGER_DELAYS = [
  'anim-delay-0',
  'anim-delay-80',
  'anim-delay-160',
  'anim-delay-240',
  'anim-delay-320',
  'anim-delay-400',
] as const

function getStaggerClass(index: number) {
  return STAGGER_DELAYS[Math.min(index, STAGGER_DELAYS.length - 1)]
}

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
}: {
  index: number
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const delay = getStaggerClass(index)
  return (
    <div
      className={`animate-fade-in-up opacity-init-0 ${delay} ${className}`}
      style={style}
    >
      {children}
    </div>
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
}: {
  index: number
  children: ReactNode
  className?: string
  style?: CSSProperties
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
}) {
  const delay = getStaggerClass(index)
  return (
    <tr
      className={`animate-fade-in-up opacity-init-0 ${delay} ${className}`}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {children}
    </tr>
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
              className="py-3 pr-3"
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
}: {
  icon?: ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      {icon && (
        <div
          className="flex h-13 w-13 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'var(--admin-accent-bg)' }}
        >
          {icon}
        </div>
      )}
      <div>
        <p
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}
        >
          {title}
        </p>
        {description && (
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
