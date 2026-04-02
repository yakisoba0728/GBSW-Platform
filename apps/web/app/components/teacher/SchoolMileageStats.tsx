'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Card,
  FilterRow,
  NoticeBox,
  SectionHeader,
  SectionTitle,
  SCHOOL_OPTIONS,
  StatCard,
  inputStyle,
} from './teacher-shared'
import { AnimatedListItem, ListEmptyState, ListSkeleton } from '../ui/list'
import type {
  CategoryStat,
  MileageType,
  SchoolCode,
  SchoolMileageHistoryItem,
} from './school-mileage-types'

function BarChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function CategoryBarRow({
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
  type: MileageType
  mounted: boolean
}) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
  const barColor = type === 'reward' ? '#16a34a' : '#dc2626'

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className="w-[100px] flex-shrink-0 truncate text-xs"
        style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}
      >
        {label}
      </span>
      <div className="flex-1 overflow-hidden rounded-full h-2" style={{ backgroundColor: 'var(--admin-border)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: mounted ? `${pct}%` : '0%',
            backgroundColor: barColor,
            transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <div className="flex w-[80px] flex-shrink-0 justify-end gap-2 text-[11px]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
        <span style={{ color: 'var(--admin-text-muted)' }}>{count}건</span>
        <span style={{ color: barColor }}>{type === 'reward' ? '+' : '-'}{totalScore}점</span>
      </div>
    </div>
  )
}

export default function SchoolMileageStats() {
  const [filterSchool, setFilterSchool] = useState<SchoolCode | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [allEntries, setAllEntries] = useState<SchoolMileageHistoryItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasQueried, setHasQueried] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)

  const [mounted, setMounted] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (allEntries.length > 0) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true))
      })
      return () => cancelAnimationFrame(t)
    }
    setMounted(false)
  }, [allEntries])

  const loadStats = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsLoading(true)
    setQueryError(null)
    setMounted(false)

    try {
      const params = new URLSearchParams({ pageSize: '500', page: '1' })
      if (filterSchool) params.set('school', filterSchool)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/teacher/school-mileage/entries?${params.toString()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setQueryError(data?.message ?? '통계 데이터를 불러오지 못했습니다.')
        setAllEntries([])
        setTotalCount(0)
      } else {
        setAllEntries(Array.isArray(data?.items) ? data.items : [])
        setTotalCount(data?.totalCount ?? 0)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setQueryError('통계 조회 중 문제가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
      setHasQueried(true)
    }
  }, [filterSchool, startDate, endDate])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const summary = useMemo(() => {
    const rewards = allEntries.filter((e) => e.type === 'reward')
    const penalties = allEntries.filter((e) => e.type === 'penalty')
    return {
      rewardCount: rewards.length,
      penaltyCount: penalties.length,
      rewardSum: rewards.reduce((acc, e) => acc + e.score, 0),
      penaltySum: penalties.reduce((acc, e) => acc + e.score, 0),
      uniqueStudents: new Set(allEntries.map((e) => e.studentId)).size,
    }
  }, [allEntries])

  const categoryStats = useMemo((): CategoryStat[] => {
    const map = new Map<string, CategoryStat>()
    for (const entry of allEntries) {
      const key = `${entry.type}::${entry.ruleCategory}`
      const existing = map.get(key) ?? {
        category: entry.ruleCategory,
        type: entry.type,
        count: 0,
        totalScore: 0,
      }
      map.set(key, {
        ...existing,
        count: existing.count + 1,
        totalScore: existing.totalScore + entry.score,
      })
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [allEntries])

  const rewardCategoryStats = useMemo(
    () => categoryStats.filter((c) => c.type === 'reward'),
    [categoryStats],
  )
  const penaltyCategoryStats = useMemo(
    () => categoryStats.filter((c) => c.type === 'penalty'),
    [categoryStats],
  )

  const top5Rules = useMemo(() => {
    const map = new Map<number, { ruleId: number; ruleName: string; type: MileageType; count: number; totalScore: number }>()
    for (const entry of allEntries) {
      const ex = map.get(entry.ruleId) ?? { ruleId: entry.ruleId, ruleName: entry.ruleName, type: entry.type, count: 0, totalScore: 0 }
      map.set(entry.ruleId, { ...ex, count: ex.count + 1, totalScore: ex.totalScore + entry.score })
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  }, [allEntries])

  const maxRewardCount = useMemo(
    () => Math.max(...rewardCategoryStats.map((c) => c.count), 1),
    [rewardCategoryStats],
  )
  const maxPenaltyCount = useMemo(
    () => Math.max(...penaltyCategoryStats.map((c) => c.count), 1),
    [penaltyCategoryStats],
  )

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          title="통계 보기"
          subtitle="기간별 상벌점 분포와 규칙별 집계를 확인합니다. 최대 500건까지 조회됩니다."
        />
        <div className="mt-4">
          <FilterRow>
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value as SchoolCode | '')}
              className="rounded-lg border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">전체 학교</option>
              {SCHOOL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            />
            <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            />

            <button
              type="button"
              onClick={() => { void loadStats() }}
              disabled={isLoading}
              className="rounded-lg px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                backgroundColor: 'var(--admin-accent)',
                color: '#fff',
              }}
            >
              {isLoading ? '조회 중...' : '조회'}
            </button>
          </FilterRow>
        </div>
      </Card>

      {queryError && <NoticeBox type="error" message={queryError} />}

      {!hasQueried && !isLoading && (
        <Card>
          <ListEmptyState
            icon={<BarChartIcon />}
            title="조회 조건을 설정하세요"
            description="학교와 날짜 범위를 선택하고 조회 버튼을 클릭하세요."
          />
        </Card>
      )}

      {isLoading && (
        <div className="space-y-4">
          <ListSkeleton count={5} rowHeight="h-20" />
        </div>
      )}

      {hasQueried && !isLoading && allEntries.length === 0 && !queryError && (
        <Card>
          <ListEmptyState
            icon={<BarChartIcon />}
            title="조회 결과가 없습니다"
            description="다른 조건으로 다시 조회해 보세요."
          />
        </Card>
      )}

      {hasQueried && !isLoading && allEntries.length > 0 && (
        <>
          {totalCount > 500 && (
            <NoticeBox type="error" message={`전체 ${totalCount}건 중 최근 500건만 표시됩니다. 정확한 통계를 위해 날짜 범위를 좁혀 주세요.`} />
          )}

          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="상점 부여 수" value={`${summary.rewardCount}건`} colorToken="green" />
            <StatCard label="벌점 부여 수" value={`${summary.penaltyCount}건`} colorToken="red" />
            <StatCard label="상점 합계" value={`+${summary.rewardSum}점`} colorToken="green" />
            <StatCard label="벌점 합계" value={`-${summary.penaltySum}점`} colorToken="red" />
            <StatCard label="대상 학생 수" value={`${summary.uniqueStudents}명`} />
          </div>

          {/* 카테고리별 바 차트 */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <SectionTitle>카테고리별 집계 — 상점</SectionTitle>
              {rewardCategoryStats.length === 0 ? (
                <p className="py-4 text-center text-xs" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                  해당 기간에 상점 내역이 없습니다.
                </p>
              ) : (
                <div className="space-y-1 mt-2">
                  {rewardCategoryStats.map((stat) => (
                    <CategoryBarRow
                      key={stat.category}
                      label={stat.category}
                      count={stat.count}
                      totalScore={stat.totalScore}
                      maxCount={maxRewardCount}
                      type="reward"
                      mounted={mounted}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle>카테고리별 집계 — 벌점</SectionTitle>
              {penaltyCategoryStats.length === 0 ? (
                <p className="py-4 text-center text-xs" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                  해당 기간에 벌점 내역이 없습니다.
                </p>
              ) : (
                <div className="space-y-1 mt-2">
                  {penaltyCategoryStats.map((stat) => (
                    <CategoryBarRow
                      key={stat.category}
                      label={stat.category}
                      count={stat.count}
                      totalScore={stat.totalScore}
                      maxCount={maxPenaltyCount}
                      type="penalty"
                      mounted={mounted}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Top 5 규칙 */}
          {top5Rules.length > 0 && (
            <Card>
              <SectionTitle>규칙별 Top 5</SectionTitle>
              <div className="mt-3 space-y-2">
                {top5Rules.map((rule, i) => (
                  <AnimatedListItem key={rule.ruleId} index={i}>
                    <div
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                      style={{ borderColor: 'var(--admin-border)', backgroundColor: 'var(--admin-bg)' }}
                    >
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: i === 0 ? 'rgba(251,191,36,0.2)' : 'var(--admin-border)',
                          color: i === 0 ? '#b45309' : 'var(--admin-text-muted)',
                          fontFamily: 'var(--font-space-grotesk)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <Badge type={rule.type}>{rule.type === 'reward' ? '상점' : '벌점'}</Badge>
                      <span className="min-w-0 flex-1 truncate text-sm" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
                        {rule.ruleName}
                      </span>
                      <span className="flex-shrink-0 text-xs font-semibold" style={{
                        fontFamily: 'var(--font-space-grotesk)',
                        color: rule.type === 'reward' ? '#16a34a' : '#dc2626',
                      }}>
                        {rule.count}건 · {rule.type === 'reward' ? '+' : '-'}{rule.totalScore}점
                      </span>
                    </div>
                  </AnimatedListItem>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
