'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { StatCard, ScoreSummaryBar, Card, SectionTitle } from '@/app/components/teacher/teacher-shared'
import type { StudentMileageSummary, SchoolMileageHistoryItem } from './student-mileage-types'

const ENTRY_PAGE_SIZE = 100

// ─── Skeleton for Stat Cards ────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
    >
      <div
        className="relative overflow-hidden rounded-md"
        style={{ height: 12, width: '40%', backgroundColor: 'var(--border)' }}
      >
        <div
          className="absolute inset-0 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
        />
      </div>
      <div
        className="relative mt-3 overflow-hidden rounded-md"
        style={{ height: 24, width: '50%', backgroundColor: 'var(--border)' }}
      >
        <div
          className="absolute inset-0 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
        />
      </div>
      <div
        className="relative mt-2 overflow-hidden rounded-md"
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

// ─── Skeleton for Bar Charts ────────────────────────────────────────────────

function BarChartSkeleton() {
  return (
    <Card>
      <div
        className="relative mb-4 overflow-hidden rounded-md"
        style={{ height: 14, width: '45%', backgroundColor: 'var(--border)' }}
      >
        <div
          className="absolute inset-0 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
        />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="relative overflow-hidden rounded-md"
              style={{ height: 20, width: 80, backgroundColor: 'var(--border)', flexShrink: 0 }}
            >
              <div
                className="absolute inset-0 animate-shimmer"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
              />
            </div>
            <div
              className="relative flex-1 overflow-hidden rounded-md"
              style={{
                height: 20,
                width: `${80 - i * 15}%`,
                backgroundColor: 'var(--border)',
              }}
            >
              <div
                className="absolute inset-0 animate-shimmer"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Category Horizontal Bar Chart ──────────────────────────────────────────

function CategoryBarChart({
  title,
  data,
  colorVar,
}: {
  title: string
  data: Array<{ category: string; total: number }>
  colorVar: string
}) {
  if (data.length === 0) {
    return (
      <Card>
        <SectionTitle>{title}</SectionTitle>
        <p
          className="py-6 text-center text-xs"
          style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
        >
          데이터가 없습니다.
        </p>
      </Card>
    )
  }

  const maxScore = Math.max(...data.map((d) => d.total))
  const totalScore = data.reduce((sum, d) => sum + d.total, 0)

  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-2.5">
        {data.map((item, index) => {
          const pct = maxScore > 0 ? Math.round((item.total / maxScore) * 100) : 0
          const share = totalScore > 0 ? Math.round((item.total / totalScore) * 100) : 0
          return (
            <div key={item.category} className="flex items-center gap-3">
              <span
                className="text-[11px] font-medium"
                style={{
                  width: 80,
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--fg-muted)',
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                }}
                title={item.category}
              >
                {item.category}
              </span>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                  style={{
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: colorVar,
                    minWidth: pct > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span
                className="text-[12px] font-semibold"
                style={{
                  width: 80,
                  flexShrink: 0,
                  textAlign: 'right',
                  color: colorVar,
                  fontFamily: 'var(--font-space-grotesk)',
                }}
              >
                {item.total}
                <span
                  className="ml-1 text-[11px] font-normal"
                  style={{ color: 'var(--fg-muted)' }}
                >
                  ({share}%)
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Monthly Trend Chart ────────────────────────────────────────────────────

function MonthlyTrendChart({
  data,
}: {
  data: Array<{ key: string; label: string; reward: number; penalty: number }>
}) {
  if (data.length === 0) {
    return (
      <Card>
        <SectionTitle>월별 추이 (최근 6개월)</SectionTitle>
        <p
          className="py-6 text-center text-xs"
          style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
        >
          데이터가 없습니다.
        </p>
      </Card>
    )
  }

  const maxTotal = Math.max(...data.map((d) => d.reward + d.penalty), 1)
  const yAxisMax = maxTotal
  const yAxisMid = Math.round(yAxisMax / 2)

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>월별 추이 (최근 6개월)</SectionTitle>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: 'var(--reward)',
              }}
            />
            <span
              className="text-[11px]"
              style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              상점
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: 'var(--penalty)',
              }}
            />
            <span
              className="text-[11px]"
              style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              벌점
            </span>
          </span>
        </div>
      </div>

      <div className="flex" style={{ height: 200 }}>
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between pr-2"
          style={{ width: 36, flexShrink: 0 }}
        >
          <span
            className="text-[11px]"
            style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-space-grotesk)', lineHeight: 1 }}
          >
            {yAxisMax}
          </span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-space-grotesk)', lineHeight: 1 }}
          >
            {yAxisMid}
          </span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-space-grotesk)', lineHeight: 1 }}
          >
            0
          </span>
        </div>

        {/* Bars */}
        <div className="flex flex-1 items-end gap-2">
          {data.map((month, index) => {
            const total = month.reward + month.penalty
            const rewardPct = maxTotal > 0 ? (month.reward / maxTotal) * 100 : 0
            const penaltyPct = maxTotal > 0 ? (month.penalty / maxTotal) * 100 : 0

            return (
              <div
                key={month.key}
                className="flex flex-1 flex-col items-center"
                style={{ minWidth: 0 }}
              >
                {/* Bar column */}
                <div
                  className="flex w-full flex-col items-center justify-end"
                  style={{ height: 168, maxWidth: 40 }}
                >
                  {total > 0 && (
                    <div className="flex w-full flex-col">
                      {/* Penalty bar (top) */}
                      {month.penalty > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${penaltyPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.08 }}
                          style={{
                            width: '100%',
                            maxWidth: 40,
                            backgroundColor: 'var(--penalty)',
                            borderRadius: '4px 4px 0 0',
                            minHeight: month.penalty > 0 ? 2 : 0,
                          }}
                        />
                      )}
                      {/* Reward bar (bottom) */}
                      {month.reward > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${rewardPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.08 + 0.1 }}
                          style={{
                            width: '100%',
                            maxWidth: 40,
                            backgroundColor: 'var(--reward)',
                            borderRadius: month.penalty > 0 ? '0 0 4px 4px' : '4px',
                            minHeight: month.reward > 0 ? 2 : 0,
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Month label */}
                <span
                  className="mt-2 text-[11px]"
                  style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                >
                  {month.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function StudentMileageStats() {
  const [summary, setSummary] = useState<StudentMileageSummary | null>(null)
  const [entries, setEntries] = useState<SchoolMileageHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const [summaryRes, entries] = await Promise.all([
          fetch('/api/student/school-mileage/summary', {
            cache: 'no-store',
            signal: controller.signal,
          }).then((r) => {
            if (!r.ok) throw new Error('요약 데이터를 불러오지 못했습니다.')
            return r.json()
          }),
          fetchAllStudentEntries(controller.signal),
        ])

        setSummary(summaryRes.summary ?? null)
        setEntries(entries)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
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
  }, [])

  // ── Category stats (useMemo) ────────────────────────────────────────────

  const categoryStats = useMemo(() => {
    if (!entries.length) return { reward: [], penalty: [] }
    const rewardMap = new Map<string, number>()
    const penaltyMap = new Map<string, number>()
    for (const entry of entries) {
      const map = entry.type === 'reward' ? rewardMap : penaltyMap
      map.set(entry.ruleCategory, (map.get(entry.ruleCategory) ?? 0) + entry.score)
    }
    const toSorted = (map: Map<string, number>) =>
      [...map.entries()]
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
    return { reward: toSorted(rewardMap), penalty: toSorted(penaltyMap) }
  }, [entries])

  // ── Monthly stats (useMemo) ─────────────────────────────────────────────

  const monthlyStats = useMemo(() => {
    if (!entries.length) return []
    const now = new Date()
    const months: Array<{ key: string; label: string; reward: number; penalty: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({ key, label: `${d.getMonth() + 1}월`, reward: 0, penalty: 0 })
    }
    for (const entry of entries) {
      const d = new Date(entry.awardedAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const month = months.find((m) => m.key === key)
      if (month) {
        if (entry.type === 'reward') month.reward += entry.score
        else month.penalty += entry.score
      }
    }
    return months
  }, [entries])

  // ── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header skeleton */}
        <div
          style={{
            borderRadius: 12,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-subtle)',
            padding: 20,
          }}
        >
          <div
            className="relative overflow-hidden rounded-md"
            style={{ height: 10, width: '30%', backgroundColor: 'var(--border)', marginBottom: 10 }}
          >
            <div
              className="absolute inset-0 animate-shimmer"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
            />
          </div>
          <div
            className="relative overflow-hidden rounded-md"
            style={{ height: 20, width: '40%', backgroundColor: 'var(--border)', marginBottom: 8 }}
          >
            <div
              className="absolute inset-0 animate-shimmer"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
            />
          </div>
          <div
            className="relative overflow-hidden rounded-md"
            style={{ height: 12, width: '60%', backgroundColor: 'var(--border)' }}
          >
            <div
              className="absolute inset-0 animate-shimmer"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }}
            />
          </div>
        </div>

        {/* Stat card skeletons */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Bar chart skeletons */}
        <BarChartSkeleton />
        <BarChartSkeleton />
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className="rounded-xl border px-5 py-4 text-xs"
          style={{
            borderColor: 'var(--penalty)',
            backgroundColor: 'color-mix(in srgb, var(--penalty) 8%, transparent)',
            color: 'var(--penalty)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          }}
        >
          {error}
        </div>
      </div>
    )
  }

  // ── Derived values ──────────────────────────────────────────────────────

  const rewardTotal = summary?.rewardTotal ?? 0
  const penaltyTotal = summary?.penaltyTotal ?? 0
  const netScore = summary?.netScore ?? 0
  const entryCount = summary?.entryCount ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
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
          나의 상벌점 통계를 확인하세요.
        </p>
      </motion.div>

      {/* ── 2. Four stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.06 }}
        >
          <StatCard
            label="총 상점"
            value={`+${rewardTotal}`}
            subValue="상점 합계"
            colorToken="green"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
        >
          <StatCard
            label="총 벌점"
            value={`-${penaltyTotal}`}
            subValue="벌점 합계"
            colorToken="red"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.14 }}
        >
          <StatCard
            label="순점수"
            value={netScore}
            subValue="상점 - 벌점"
            colorToken="default"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.18 }}
        >
          <StatCard
            label="총 건수"
            value={entryCount}
            subValue="부여 횟수"
            colorToken="default"
          />
        </motion.div>
      </div>

      {/* ── 3. Score summary bar ───────────────────────────────────────── */}
      {(rewardTotal > 0 || penaltyTotal > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.22 }}
        >
          <Card>
            <ScoreSummaryBar reward={rewardTotal} penalty={penaltyTotal} />
          </Card>
        </motion.div>
      )}

      {/* ── 4. Category bar chart - reward ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.26 }}
      >
        <CategoryBarChart
          title="카테고리별 상점 분포"
          data={categoryStats.reward}
          colorVar="var(--reward)"
        />
      </motion.div>

      {/* ── 5. Category bar chart - penalty ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.3 }}
      >
        <CategoryBarChart
          title="카테고리별 벌점 분포"
          data={categoryStats.penalty}
          colorVar="var(--penalty)"
        />
      </motion.div>

      {/* ── 6. Monthly trend chart ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.34 }}
      >
        <MonthlyTrendChart data={monthlyStats} />
      </motion.div>
    </div>
  )
}

async function fetchAllStudentEntries(signal: AbortSignal) {
  const firstPage = await fetchStudentEntriesPage(1, signal)
  const totalPages = Math.max(
    1,
    Math.ceil(firstPage.totalCount / firstPage.pageSize),
  )

  if (totalPages === 1) {
    return firstPage.items
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchStudentEntriesPage(index + 2, signal),
    ),
  )

  return [
    ...firstPage.items,
    ...remainingPages.flatMap((page) => page.items),
  ]
}

async function fetchStudentEntriesPage(page: number, signal: AbortSignal) {
  const response = await fetch(
    `/api/student/school-mileage/entries?page=${page}&pageSize=${ENTRY_PAGE_SIZE}`,
    {
      cache: 'no-store',
      signal,
    },
  )
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(result?.message ?? '상벌점 내역을 불러오지 못했습니다.')
  }

  return {
    items: Array.isArray(result?.items)
      ? (result.items as SchoolMileageHistoryItem[])
      : [],
    totalCount:
      typeof result?.totalCount === 'number' && result.totalCount >= 0
        ? result.totalCount
        : 0,
    pageSize:
      typeof result?.pageSize === 'number' && result.pageSize > 0
        ? result.pageSize
        : ENTRY_PAGE_SIZE,
  }
}
