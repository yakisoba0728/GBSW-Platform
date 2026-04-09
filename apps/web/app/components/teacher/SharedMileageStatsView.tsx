'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, SectionTitle, StatCard } from '../ui/card'
import {
  Badge,
  FilterRow,
  NoticeBox,
  SectionHeader,
  inputStyle,
} from '../mileage/shared'
import SuccessModal from '../ui/success-modal'
import { Button } from '../ui/button'
import { AnimatedListItem, ListEmptyState, LoadingSpinner } from '../ui/list'
import type {
  SharedCategoryStat,
  SharedMileageOverviewResponse,
  SharedTopRuleStat,
} from './shared-mileage-types'
import { getQueryString, useUpdateSearchParams } from '@/lib/url-state'
import { BarChartIcon, CategoryBarRow } from './SharedMileageStatsParts'

type SchoolOption = {
  value: string
  label: string
}

type SharedMileageStatsViewProps<Response extends SharedMileageOverviewResponse> = {
  title: string
  subtitle: string
  fetchPath: string
  emptyResponse: Response
  showSchoolFilter?: boolean
  schoolOptions?: SchoolOption[]
  rewardSectionTitle: string
  penaltySectionTitle: string
  rewardEmptyMessage: string
  penaltyEmptyMessage: string
  queryFailureMessage: string
  queryExceptionMessage: string
}

export default function SharedMileageStatsView<
  Response extends SharedMileageOverviewResponse,
>({
  title,
  subtitle,
  fetchPath,
  emptyResponse,
  showSchoolFilter = false,
  schoolOptions = [],
  rewardSectionTitle,
  penaltySectionTitle,
  rewardEmptyMessage,
  penaltyEmptyMessage,
  queryFailureMessage,
  queryExceptionMessage,
}: SharedMileageStatsViewProps<Response>) {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const filterSchool = getQueryString(searchParams, 'school')
  const filterYear = getQueryString(searchParams, 'year')
  const startDate = getQueryString(searchParams, 'startDate')
  const endDate = getQueryString(searchParams, 'endDate')

  const [response, setResponse] = useState<Response>(emptyResponse)
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

      if (showSchoolFilter && filterSchool) {
        params.set('school', filterSchool)
      }

      if (filterYear) params.set('year', filterYear)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`${fetchPath}?${params.toString()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)

      if (abortRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if (!res.ok) {
        setQueryError(data?.message ?? queryFailureMessage)
        setShowQueryErrorModal(true)
        setResponse(emptyResponse)
        return
      }

      setResponse({
        summary: data?.summary ?? emptyResponse.summary,
        categoryStats: Array.isArray(data?.categoryStats)
          ? (data.categoryStats as SharedCategoryStat[])
          : [],
        topRules: Array.isArray(data?.topRules)
          ? (data.topRules as SharedTopRuleStat[])
          : [],
      } as Response)
    } catch (error) {
      if (abortRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if ((error as Error).name !== 'AbortError') {
        setQueryError(queryExceptionMessage)
        setShowQueryErrorModal(true)
        setResponse(emptyResponse)
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null
        setIsLoading(false)
      }
    }
  }, [
    emptyResponse,
    endDate,
    fetchPath,
    filterSchool,
    filterYear,
    queryExceptionMessage,
    queryFailureMessage,
    showSchoolFilter,
    startDate,
  ])

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
    <div className="flex h-full flex-col gap-4">
      <Card>
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="mt-4">
          <FilterRow>
            {showSchoolFilter && schoolOptions.length > 0 && (
              <select
                value={filterSchool}
                onChange={(event) =>
                  updateSearchParams({
                    school: event.target.value,
                    page: null,
                  })
                }
                className="h-8 rounded-lg border bg-transparent px-2.5 text-xs outline-none"
                style={inputStyle}
              >
                <option value="">전체 학교</option>
                {schoolOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterYear}
              onChange={(event) =>
                updateSearchParams({ year: event.target.value })
              }
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

            <Button
              variant="primary"
              size="sm"
              loading={isLoading}
              disabled={isLoading}
              onClick={() => {
                void loadStats()
              }}
            >
              새로고침
            </Button>
          </FilterRow>
        </div>
      </Card>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <SuccessModal
          open={showQueryErrorModal && !!queryError}
          onClose={() => setShowQueryErrorModal(false)}
          type="error"
          title="통계 조회 실패"
          description={queryError ?? ''}
        />

        {queryError && <NoticeBox type="error" message={queryError} />}

        {isLoading ? (
          <div className="flex h-full min-h-[120px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {response.summary.totalCount === 0 && !queryError && (
              <Card className="flex min-h-0 flex-1 flex-col">
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
                    <SectionTitle>{rewardSectionTitle}</SectionTitle>
                    {rewardCategoryStats.length === 0 ? (
                      <div className="flex min-h-[140px] items-center justify-center">
                        <p
                          className="text-center text-xs"
                          style={{
                            color: 'var(--admin-text-muted)',
                            fontFamily:
                              'var(--font-noto-sans-kr), sans-serif',
                          }}
                        >
                          {rewardEmptyMessage}
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
                    <SectionTitle>{penaltySectionTitle}</SectionTitle>
                    {penaltyCategoryStats.length === 0 ? (
                      <div className="flex min-h-[140px] items-center justify-center">
                        <p
                          className="text-center text-xs"
                          style={{
                            color: 'var(--admin-text-muted)',
                            fontFamily:
                              'var(--font-noto-sans-kr), sans-serif',
                          }}
                        >
                          {penaltyEmptyMessage}
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
                                  index === 0
                                    ? '#b45309'
                                    : 'var(--admin-text-muted)',
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
                                fontFamily:
                                  'var(--font-noto-sans-kr), sans-serif',
                                color: 'var(--fg)',
                              }}
                            >
                              {rule.ruleName}
                            </span>
                            <span
                              className="flex-shrink-0 text-xs font-semibold"
                              style={{
                                fontFamily: 'var(--font-space-grotesk)',
                                color:
                                  rule.type === 'reward'
                                    ? 'var(--reward)'
                                    : 'var(--penalty)',
                              }}
                            >
                              {rule.count}건 ·{' '}
                              {rule.type === 'reward' ? '+' : '-'}
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
          </motion.div>
        )}
      </div>
    </div>
  )
}
