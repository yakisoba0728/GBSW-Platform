import type { CSSProperties } from 'react'

// ─── Keyframe injection ───────────────────────────────────────────────────────
const shimmerStyle = `
@keyframes skeletonShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`

const shimmerBase: CSSProperties = {
  background:
    'linear-gradient(90deg, var(--bg-muted) 25%, var(--bg-subtle) 50%, var(--bg-muted) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 1.6s ease-in-out infinite',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  className,
}: SkeletonProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />
      <div
        className={className}
        style={{
          ...shimmerBase,
          width,
          height,
          borderRadius,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
    </>
  )
}

// ─── SkeletonText ─────────────────────────────────────────────────────────────
interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      aria-hidden="true"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...shimmerBase,
            width: i === lines - 1 ? '60%' : '100%',
            height: '16px',
            borderRadius: '6px',
          }}
        />
      ))}
    </div>
  )
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────
interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={className}
      style={{
        ...shimmerBase,
        width: '100%',
        height: '120px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}
      aria-hidden="true"
    />
  )
}

// ─── SkeletonTable ────────────────────────────────────────────────────────────
interface SkeletonTableProps {
  rows?: number
  cols?: number
  className?: string
}

export function SkeletonTable({ rows = 5, cols = 4, className }: SkeletonTableProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      aria-hidden="true"
    >
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            style={{
              ...shimmerBase,
              height: '20px',
              borderRadius: '6px',
            }}
          />
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px' }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              style={{
                ...shimmerBase,
                height: '16px',
                borderRadius: '6px',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── SkeletonList ─────────────────────────────────────────────────────────────
interface SkeletonListProps {
  items?: number
  className?: string
}

export function SkeletonList({ items = 6, className }: SkeletonListProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      aria-hidden="true"
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar circle */}
          <div
            style={{
              ...shimmerBase,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
          {/* Text lines */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              style={{
                ...shimmerBase,
                width: '60%',
                height: '14px',
                borderRadius: '6px',
              }}
            />
            <div
              style={{
                ...shimmerBase,
                width: '40%',
                height: '12px',
                borderRadius: '6px',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
