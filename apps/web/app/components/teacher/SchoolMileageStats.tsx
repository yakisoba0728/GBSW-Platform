'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Card,
  FilterRow,
  NoticeBox,
  SCHOOL_OPTIONS,
  SectionHeader,
  SectionTitle,
  StatCard,
  inputStyle,
} from '../mileage/shared'
import SuccessModal from '../ui/success-modal'
import { Button } from '../ui/button'
import { AnimatedListItem, ListEmptyState, ListSkeleton, StatCardSkeleton } from '../ui/list'
import type {
  CategoryStat,
  MileageType,
  SchoolCode,
  SchoolMileageOverviewResponse,
  TopRuleStat,
} from './school-mileage-types'
import { getQueryString, useUpdateSearchParams } from '@/lib/url-state'

function BarChartIcon() {
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
            width: mounted ? `${pct}%` : '0%',
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

const EMPTY_RESPONSE: SchoolMileageOverviewResponse = {
  summary: {
    rewardCount: 0,
    penaltyCount: 0,
    rewardSum: 0,
    penaltySum: 0,
    uniqueStudents: 0,
    totalCount: 0,
  },
  categoryStats: [],
  topRules: [],
}

export default function SchoolMileageStats() {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const filterSchool = getQueryString(searchParams, 'school') as SchoolCode | ''
  const filterYear = getQueryString(searchParams, 'year')
  const startDate = getQueryString(searchParams, 'startDate')
  const endDate = getQueryString(searchParams, 'endDate')

  const [response, setResponse] =
    useState<SchoolMileageOverviewResponse>(EMPTY_RESPONSE)
  const [isLoading, setIsLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [showQueryErrorModal, setShowQueryErrorModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const loadStats = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsLoading(true)
    setQueryError(null)
    setShowQueryErrorModal(false)
    setMounted(false)

    try {
      const params = new URLSearchParams()
      if (filterSchool) params.set('school', filterSchool)
      if (filterYear) params.set('year', filterYear)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(
        `/api/teacher/school-mileage/analytics/overview?${params.toString()}`,
        {
          signal: ctrl.signal,
          cache: 'no-store',
        },
      )
      const data = await res.json().catch(() => null)

      if (abortRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if (!res.ok) {
        setQueryError(data?.message ?? '통계 데이터를 불러오지 못했습니다.')
        setShowQueryErrorModal(true)
        setResponse(EMPTY_RESPONSE)
        return
      }

      setResponse({
        summary: data?.summary ?? EMPTY_RESPONSE.summary,
        categoryStats: Array.isArray(data?.categoryStats)
          ? (data.categoryStats as CategoryStat[])
          : [],
        topRules: Array.isArray(data?.topRules)
          ? (data.topRules as TopRuleStat[])
          : [],
      })
    } catch (error) {
      if (abortRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if ((error as Error).name !== 'AbortError') {
        setQueryError('통계 조회 중 문제가 발생했습니다.')
        setShowQueryErrorModal(true)
        setResponse(EMPTY_RESPONSE)
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null
        setIsLoading(false)
      }
    }
  }, [endDate, filterSchool, filterYear, startDate])

  useEffect(() => {
    void loadStats()

    return () => {
      abortRef.current?.abort()
    }
  }, [loadStats])

  useEffect(() => {
    if (response.summary.totalCount > 0) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true))
      })

      return () => cancelAnimationFrame(frame)
    }

    setMounted(false)
  }, [response.summary.totalCount])

  const rewardCategoryStats = useMemo(
    () => response.categoryStats.filter((stat) => stat.type === 'reward'),
    [response.categoryStats],
  )
  const penaltyCategoryStats = useMemo(
    () => response.categoryStats.filter((stat) => stat.type === 'penalty'),
    [response.categoryStats],
  )
  const maxRewardCount = useMemo(
    () => Math.max(...rewardCategoryStats.map((stat) => stat.count), 1),
    [rewardCategoryStats],
  )
  const maxPenaltyCount = useMemo(
    () => Math.max(...penaltyCategoryStats.map((stat) => stat.count), 1),
    [penaltyCategoryStats],
  )

  return (
    <div className="flex flex-col h-full gap-4">
      <Card>
        <SectionHeader
          title="통계 보기"
          subtitle="기간별 상벌점 분포와 규칙별 집계를 확인합니다."
        />
        <div className="mt-4">
          <FilterRow>
            <select
              value={filterSchool}
              onChange={(event) =>
                updateSearchParams({ school: event.target.value, page: null })
              }
              className="h-8 rounded-lg border bg-transparent px-2.5 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">전체 학교</option>
              {SCHOOL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={(event) => updateSearchParams({ year: event.target.value })}
              className="h-8 rounded-lg border bg-transparent px-2.5 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                updateSearchParams({ startDate: event.target.value })
              }
              className="h-8 rounded-lg border px-2.5 text-xs outline-none"
              style={inputStyle}
            />
            <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              ~
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                updateSearchParams({ endDate: event.target.value })
              }
              className="h-8 rounded-lg border px-2.5 text-xs outline-none"
              style={inputStyle}
            />

            <Button variant="primary" size="sm" loading={isLoading} disabled={isLoading} onClick={() => { void loadStats() }}>새로고침</Button>
          </FilterRow>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
      <SuccessModal
        open={showQueryErrorModal && !!queryError}
        onClose={() => setShowQueryErrorModal(false)}
        type="error"
        title="통계 조회 실패"
        description={queryError ?? ''}
      />

      {queryError && (
        <NoticeBox
          type="error"
          message={queryError}
        />
      )}

      {isLoading && response.summary.totalCount === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <ListSkeleton count={3} rowHeight="h-16" />
        </div>
      )}

      {!isLoading && response.summary.totalCount === 0 && !queryError && (
        <Card className="flex flex-1 flex-col">
          <ListEmptyState
            fill
            icon={<BarChartIcon />}
            title="조회 결과가 없습니다"
            description="다른 조건으로 다시 조회해 보세요."
          />
        </Card>
      )}

      {response.summary.totalCount > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard
              label="상점 부여 수"
              value={`${response.summary.rewardCount}건`}
              colorToken="green"
            />
            <StatCard
              label="벌점 부여 수"
              value={`${response.summary.penaltyCount}건`}
              colorToken="red"
            />
            <StatCard
              label="상점 합계"
              value={`+${response.summary.rewardSum}점`}
              colorToken="green"
            />
            <StatCard
              label="벌점 합계"
              value={`-${response.summary.penaltySum}점`}
              colorToken="red"
            />
            <StatCard
              label="대상 학생 수"
              value={`${response.summary.uniqueStudents}명`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <SectionTitle>카테고리별 집계 — 상점</SectionTitle>
              {rewardCategoryStats.length === 0 ? (
                <div className="flex min-h-[140px] items-center justify-center">
                  <p
                    className="text-center text-xs"
                    style={{
                      color: 'var(--admin-text-muted)',
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    }}
                  >
                    해당 기간에 상점 내역이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="mt-2 space-y-1">
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
                <div className="flex min-h-[140px] items-center justify-center">
                  <p
                    className="text-center text-xs"
                    style={{
                      color: 'var(--admin-text-muted)',
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    }}
                  >
                    해당 기간에 벌점 내역이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="mt-2 space-y-1">
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

          {response.topRules.length > 0 && (
            <Card>
              <SectionTitle>규칙별 Top 5</SectionTitle>
              <div className="mt-3 space-y-2">
                {response.topRules.map((rule, index) => (
                  <AnimatedListItem key={rule.ruleId} index={index}>
                    <div
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor: 'var(--admin-border)',
                        backgroundColor: 'var(--admin-bg)',
                      }}
                    >
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor:
                            index === 0
                              ? 'rgba(251,191,36,0.2)'
                              : 'var(--admin-border)',
                          color:
                            index === 0 ? '#b45309' : 'var(--admin-text-muted)',
                          fontFamily: 'var(--font-space-grotesk)',
                        }}
                      >
                        {index + 1}
                      </span>
                      <Badge type={rule.type}>
                        {rule.type === 'reward' ? '상점' : '벌점'}
                      </Badge>
                      <span
                        className="min-w-0 flex-1 truncate text-sm"
                        style={{
                          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          color: 'var(--fg)',
                        }}
                      >
                        {rule.ruleName}
                      </span>
                      <span
                        className="flex-shrink-0 text-xs font-semibold"
                        style={{
                          fontFamily: 'var(--font-space-grotesk)',
                          color: rule.type === 'reward' ? 'var(--reward)' : 'var(--penalty)',
                        }}
                      >
                        {rule.count}건 · {rule.type === 'reward' ? '+' : '-'}
                        {rule.totalScore}점
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
    </div>
  )
}
