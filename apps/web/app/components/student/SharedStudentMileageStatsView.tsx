'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, StatCard } from '@/app/components/ui/card'
import { ScoreSummaryBar } from '@/app/components/mileage/shared'
import {
  getSectionMotion,
  getStaggerDelay,
  useMotionPreference,
} from '@/app/components/ui/motion'
import {
  ChartCardSkeleton,
  PageHeaderSkeleton,
  SummaryBarSkeleton,
} from '@/app/components/ui/page-skeletons'
import { StatCardSkeleton } from '@/app/components/ui/list'
import { CategoryBarChart, MonthlyTrendChart } from './student-mileage-stats-charts'

type SharedStudentSummary = {
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  entryCount: number
}

type SharedStudentMileageStatsViewProps = {
  statsPath: string
  introDescription: string
}

export default function SharedStudentMileageStatsView({
  statsPath,
  introDescription,
}: SharedStudentMileageStatsViewProps) {
  const prefersReducedMotion = useMotionPreference()
  const getMotion = (step = 0) =>
    getSectionMotion(
      prefersReducedMotion,
      step === 0 ? 0 : getStaggerDelay(step),
    )

  const [summary, setSummary] = useState<SharedStudentSummary | null>(null)
  const [categoryStats, setCategoryStats] = useState<{
    reward: Array<{ category: string; total: number }>
    penalty: Array<{ category: string; total: number }>
  }>({ reward: [], penalty: [] })
  const [monthlyStats, setMonthlyStats] = useState<
    Array<{ key: string; label: string; reward: number; penalty: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(statsPath, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.message ?? '통계 데이터를 불러오지 못했습니다.')
        }

        setSummary((payload?.summary ?? null) as SharedStudentSummary | null)
        setCategoryStats({
          reward: Array.isArray(payload?.categoryStats?.reward)
            ? payload.categoryStats.reward
            : [],
          penalty: Array.isArray(payload?.categoryStats?.penalty)
            ? payload.categoryStats.penalty
            : [],
        })
        setMonthlyStats(
          Array.isArray(payload?.monthlyStats) ? payload.monthlyStats : [],
        )
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : '데이터를 불러오는 중 오류가 발생했습니다.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      controller.abort()
    }
  }, [statsPath])

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4">
        <PageHeaderSkeleton />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <SummaryBarSkeleton />
        <ChartCardSkeleton />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col gap-4">
        <div
          className="rounded-xl border px-5 py-4 text-xs"
          style={{
            borderColor: 'var(--penalty)',
            backgroundColor:
              'color-mix(in srgb, var(--penalty) 8%, transparent)',
            color: 'var(--penalty)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          }}
        >
          {error}
        </div>
      </div>
    )
  }

  const rewardTotal = summary?.rewardTotal ?? 0
  const penaltyTotal = summary?.penaltyTotal ?? 0
  const netScore = summary?.netScore ?? 0
  const entryCount = summary?.entryCount ?? 0

  return (
    <div className="flex h-full flex-col gap-4">
      <motion.div
        initial={getMotion().initial}
        animate={getMotion().animate}
        transition={getMotion().transition}
        style={{
          borderRadius: 12,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-subtle)',
          padding: '20px',
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 8,
            fontFamily: 'var(--font-space-grotesk)',
          }}
        >
          My Statistics
        </p>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--fg)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
          }}
        >
          내 통계
        </h1>
        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          }}
        >
          {introDescription}
        </p>
      </motion.div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <motion.div
            initial={getMotion(1).initial}
            animate={getMotion(1).animate}
            transition={getMotion(1).transition}
          >
            <StatCard
              label="총 상점"
              value={`+${rewardTotal}`}
              subValue="상점 합계"
              colorToken="green"
            />
          </motion.div>
          <motion.div
            initial={getMotion(2).initial}
            animate={getMotion(2).animate}
            transition={getMotion(2).transition}
          >
            <StatCard
              label="총 벌점"
              value={`-${penaltyTotal}`}
              subValue="벌점 합계"
              colorToken="red"
            />
          </motion.div>
          <motion.div
            initial={getMotion(3).initial}
            animate={getMotion(3).animate}
            transition={getMotion(3).transition}
          >
            <StatCard
              label="순점수"
              value={netScore}
              subValue="상점 - 벌점"
              colorToken="default"
            />
          </motion.div>
          <motion.div
            initial={getMotion(4).initial}
            animate={getMotion(4).animate}
            transition={getMotion(4).transition}
          >
            <StatCard
              label="총 건수"
              value={entryCount}
              subValue="부여 횟수"
              colorToken="default"
            />
          </motion.div>
        </div>

        {(rewardTotal > 0 || penaltyTotal > 0) && (
          <motion.div
            initial={getMotion(5).initial}
            animate={getMotion(5).animate}
            transition={getMotion(5).transition}
          >
            <Card>
              <ScoreSummaryBar reward={rewardTotal} penalty={penaltyTotal} />
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={getMotion(6).initial}
          animate={getMotion(6).animate}
          transition={getMotion(6).transition}
        >
          <CategoryBarChart
            title="카테고리별 상점 분포"
            data={categoryStats.reward}
            colorVar="var(--reward)"
          />
        </motion.div>

        <motion.div
          initial={getMotion(7).initial}
          animate={getMotion(7).animate}
          transition={getMotion(7).transition}
        >
          <CategoryBarChart
            title="카테고리별 벌점 분포"
            data={categoryStats.penalty}
            colorVar="var(--penalty)"
          />
        </motion.div>

        <motion.div
          initial={getMotion(8).initial}
          animate={getMotion(8).animate}
          transition={getMotion(8).transition}
        >
          <MonthlyTrendChart data={monthlyStats} />
        </motion.div>
      </div>
    </div>
  )
}
