'use client'

import { motion } from 'framer-motion'
import { Card, ScoreSummaryBar, StatCard } from '../mileage/shared'
import { LoadingSpinner } from '../ui/list'
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
      <div className="flex h-full min-h-[120px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
        <Card>
          <p
            className="text-[11px] uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fg-muted)' }}
          >
            전체 건수
          </p>
          <p
            className="mt-2 text-2xl font-semibold leading-none"
            style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fg)' }}
          >
            {summary.entryCount}건
          </p>
          <p
            className="mt-1.5 text-xs"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg-muted)' }}
          >
            조회된 총 상벌점 기록
          </p>
        </Card>
      </div>
      <Card>
        <p
          className="mb-3 text-xs font-medium"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--fg-muted)',
          }}
        >
          상점 / 벌점 비율
        </p>
        <ScoreSummaryBar
          reward={summary.rewardTotal}
          penalty={summary.penaltyTotal}
        />
      </Card>
    </motion.div>
  )
}
