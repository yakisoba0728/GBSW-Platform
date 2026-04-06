'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

// ─── DefaultIcon ──────────────────────────────────────────────────────────────
// icon prop 미제공 시 표시되는 기본 인박스 SVG.

function DefaultIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--fg-muted)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
// 데이터가 없을 때 표시되는 빈 상태 컴포넌트.
// 아이콘 · 제목 · 설명 · 액션 버튼을 중앙 정렬로 배치.

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon ?? <DefaultIcon />}
      </div>

      {/* Title */}
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--fg)',
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        {title}
      </p>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--fg-muted)',
            marginTop: 6,
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: 320,
          }}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div style={{ marginTop: 16 }}>
          {action}
        </div>
      )}
    </motion.div>
  )
}
