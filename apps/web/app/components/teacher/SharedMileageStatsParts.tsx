'use client'

import type { SharedMileageType } from './shared-mileage-types'

export function BarChartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--accent)' }}
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

export function CategoryBarRow({
  label,
  count,
  totalScore,
  maxCount,
  type,
  mounted,
}: {
  label: string
  count: number
  totalScore: number
  maxCount: number
  type: SharedMileageType
  mounted: boolean
}) {
  const percent = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
  const barColor = type === 'reward' ? 'var(--reward)' : 'var(--penalty)'

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className="w-[100px] flex-shrink-0 truncate text-xs"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--fg)',
        }}
      >
        {label}
      </span>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: mounted ? `${percent}%` : '0%',
            backgroundColor: barColor,
            transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <div
        className="flex w-[80px] flex-shrink-0 justify-end gap-2 text-[11px]"
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        <span style={{ color: 'var(--fg-muted)' }}>{count}건</span>
        <span style={{ color: barColor }}>
          {type === 'reward' ? '+' : '-'}
          {totalScore}점
        </span>
      </div>
    </div>
  )
}
