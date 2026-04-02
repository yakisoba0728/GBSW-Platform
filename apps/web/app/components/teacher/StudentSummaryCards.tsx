'use client'

import { Card, ScoreSummaryBar, StatCard } from './teacher-shared'
import type { StudentMileageSummary } from './school-mileage-types'

export default function StudentSummaryCards({
  summary,
  isLoading,
}: {
  summary: StudentMileageSummary | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="relative h-24 overflow-hidden rounded-xl border"
            style={{
              borderColor: 'var(--admin-border)',
              backgroundColor: 'var(--admin-sidebar-bg)',
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
      </div>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="상점 합계"
          value={`+${summary.rewardTotal}점`}
          subValue={`${summary.entryCount}건 중 상점`}
          colorToken="green"
        />
        <StatCard
          label="벌점 합계"
          value={`-${summary.penaltyTotal}점`}
          colorToken="red"
        />
        <StatCard
          label="순점수"
          value={`${summary.netScore >= 0 ? '+' : ''}${summary.netScore}점`}
          subValue="상점 - 벌점"
          colorToken={summary.netScore >= 0 ? 'green' : 'red'}
        />
      </div>
      <Card>
        <p
          className="mb-3 text-xs font-medium"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--admin-text-muted)',
          }}
        >
          상점 / 벌점 비율
        </p>
        <ScoreSummaryBar
          reward={summary.rewardTotal}
          penalty={summary.penaltyTotal}
        />
      </Card>
    </>
  )
}
