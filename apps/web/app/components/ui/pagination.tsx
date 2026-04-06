'use client'

import { motion } from 'framer-motion'

// ─── Page range algorithm ─────────────────────────────────────────────────────
// Always shows: first, last, current-1, current, current+1, with ellipsis gaps.
// Result is at most 7 items (numbers + '...' strings).

type PageItem = number | '...'

function buildPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: PageItem[] = []
  const visible = new Set<number>()

  visible.add(1)
  visible.add(totalPages)
  for (let d = -1; d <= 1; d++) {
    const p = page + d
    if (p >= 1 && p <= totalPages) visible.add(p)
  }

  const sorted = Array.from(visible).sort((a, b) => a - b)

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push('...')
    }
    items.push(sorted[i])
  }

  return items
}

// ─── SVG chevron icons ────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

// ─── Shared button base styles ────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  userSelect: 'none',
  flexShrink: 0,
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = '',
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (totalPages <= 1) return null

  const items = buildPageItems(page, totalPages)
  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
    >
      {/* Button row */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', justifyContent: 'center' }}>
        {/* Prev */}
        <motion.button
          type="button"
          aria-label="이전 페이지"
          disabled={prevDisabled}
          whileTap={prevDisabled ? undefined : { scale: 0.93 }}
          onClick={() => !prevDisabled && onPageChange(page - 1)}
          style={{
            ...btnBase,
            background: 'transparent',
            color: 'var(--fg-muted)',
            border: '1px solid var(--border)',
            opacity: prevDisabled ? 0.4 : 1,
            cursor: prevDisabled ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!prevDisabled) {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-muted)'
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <ChevronLeft />
        </motion.button>

        {/* Page numbers */}
        {items.map((item, idx) => {
          if (item === '...') {
            return (
              <div
                key={`ellipsis-${idx}`}
                style={{
                  ...btnBase,
                  cursor: 'default',
                  color: 'var(--fg-muted)',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                }}
              >
                &hellip;
              </div>
            )
          }

          const isActive = item === page

          return (
            <motion.button
              key={item}
              type="button"
              aria-label={`${item}페이지`}
              aria-current={isActive ? 'page' : undefined}
              whileTap={{ scale: 0.93 }}
              onClick={() => onPageChange(item)}
              style={{
                ...btnBase,
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--fg-muted)',
                border: isActive ? 'none' : '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-muted)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }
              }}
            >
              {item}
            </motion.button>
          )
        })}

        {/* Next */}
        <motion.button
          type="button"
          aria-label="다음 페이지"
          disabled={nextDisabled}
          whileTap={nextDisabled ? undefined : { scale: 0.93 }}
          onClick={() => !nextDisabled && onPageChange(page + 1)}
          style={{
            ...btnBase,
            background: 'transparent',
            color: 'var(--fg-muted)',
            border: '1px solid var(--border)',
            opacity: nextDisabled ? 0.4 : 1,
            cursor: nextDisabled ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!nextDisabled) {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-muted)'
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <ChevronRight />
        </motion.button>
      </div>

      {/* Summary */}
      <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: 0 }}>
        총 {totalPages}페이지
      </p>
    </div>
  )
}
