'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, StatCard } from '../ui/card'
import {
  FilterRow,
  NoticeBox,
  SectionHeader,
  inputStyle,
} from '../mileage/shared'
import SuccessModal from '../ui/success-modal'
import { Button } from '../ui/button'
import { ListEmptyState } from '../ui/list'
import SharedClassAnalyticsCard, {
  BuildingAnalyticsIcon,
} from './SharedClassAnalyticsCard'
import type {
  SharedClassMileageAnalyticsResponse,
  SharedClassMileageSummary,
} from './shared-mileage-types'
import { getQueryString, useUpdateSearchParams } from '@/lib/url-state'

type SchoolOption = {
  value: string
  label: string
}

type SharedMileageClassViewProps<
  Summary extends SharedClassMileageSummary,
  Response extends SharedClassMileageAnalyticsResponse<Summary>,
> = {
  title: string
  subtitle: string
  fetchPath: string
  emptyResponse: Response
  emptyCardDescription: string
  showSchoolFilter?: boolean
  schoolOptions?: SchoolOption[]
  schoolPlaceholder?: string
  requireSchoolFilter?: boolean
  noFilterTitle?: string
  noFilterDescription?: string
  queryFailureMessage: string
  queryExceptionMessage: string
}

export default function SharedMileageClassView<
  Summary extends SharedClassMileageSummary,
  Response extends SharedClassMileageAnalyticsResponse<Summary>,
>({
  title,
  subtitle,
  fetchPath,
  emptyResponse,
  emptyCardDescription,
  showSchoolFilter = false,
  schoolOptions = [],
  schoolPlaceholder = 'Select school',
  requireSchoolFilter = false,
  noFilterTitle = 'Select a school',
  noFilterDescription = 'Choose a school to load class analytics.',
  queryFailureMessage,
  queryExceptionMessage,
}: SharedMileageClassViewProps<Summary, Response>) {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const filterSchool = getQueryString(searchParams, 'school')
  const filterGrade = getQueryString(searchParams, 'year')

  const [response, setResponse] = useState<Response>(emptyResponse)
  const [isLoading, setIsLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [showQueryErrorModal, setShowQueryErrorModal] = useState(false)
  const [expandedClass, setExpandedClass] = useState<number | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const loadClassData = useCallback(async () => {
    if (requireSchoolFilter && !filterSchool) {
      abortRef.current?.abort()
      abortRef.current = null
      setResponse(emptyResponse)
      setQueryError(null)
      setShowQueryErrorModal(false)
      setExpandedClass(null)
      setIsLoading(false)
      return
    }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsLoading(true)
    setQueryError(null)
    setShowQueryErrorModal(false)
    setExpandedClass(null)

    try {
      const params = new URLSearchParams()

      if (showSchoolFilter && filterSchool) {
        params.set('school', filterSchool)
      }

      if (filterGrade) {
        params.set('year', filterGrade)
      }

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
        classes: Array.isArray(data?.classes) ? (data.classes as Summary[]) : [],
        overall: data?.overall ?? emptyResponse.overall,
      } as Response)
    } catch (error) {
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
    fetchPath,
    filterGrade,
    filterSchool,
    queryExceptionMessage,
    queryFailureMessage,
    requireSchoolFilter,
    showSchoolFilter,
  ])

  useEffect(() => {
    void loadClassData()

    return () => {
      abortRef.current?.abort()
    }
  }, [loadClassData])

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
                    year: filterGrade,
                  })
                }
                className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                style={inputStyle}
              >
                <option value="">{schoolPlaceholder}</option>
                {schoolOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterGrade}
              onChange={(event) =>
                updateSearchParams({ year: event.target.value })
              }
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={inputStyle}
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              loading={isLoading}
              disabled={isLoading || (requireSchoolFilter && !filterSchool)}
              onClick={() => void loadClassData()}
            >
              새로고침
            </Button>
          </FilterRow>
        </div>
      </Card>

      <SuccessModal
        open={showQueryErrorModal && !!queryError}
        onClose={() => setShowQueryErrorModal(false)}
        type="error"
        title="조회 실패"
        description={queryError ?? ''}
      />

      {queryError && <NoticeBox type="error" message={queryError} />}

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {requireSchoolFilter && !filterSchool && !isLoading && (
          <Card className="flex flex-1 flex-col">
            <ListEmptyState
              fill
              icon={<BuildingAnalyticsIcon />}
              title={noFilterTitle}
              description={noFilterDescription}
            />
          </Card>
        )}

        {isLoading && (!requireSchoolFilter || !!filterSchool) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="relative h-40 overflow-hidden rounded-xl border"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg-subtle)',
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
        )}

        {(!requireSchoolFilter || !!filterSchool) &&
          !isLoading &&
          response.classes.length === 0 &&
          !queryError && (
            <Card className="flex flex-1 flex-col">
              <ListEmptyState
                fill
                icon={<BuildingAnalyticsIcon />}
                title="학급 데이터가 없습니다"
                description="다른 조건으로 다시 조회해 보세요."
              />
            </Card>
          )}

        {response.classes.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatCard label="총 학급 수" value={`${response.overall.classCount}개`} />
              <StatCard
                label="총 학생 수"
                value={`${response.overall.totalStudents}명`}
              />
              <StatCard
                label="전체 상점 합계"
                value={`+${response.overall.rewardTotal}점`}
                colorToken="green"
              />
              <StatCard
                label="전체 벌점 합계"
                value={`-${response.overall.penaltyTotal}점`}
                colorToken="red"
              />
              <StatCard
                label="전체 순점수"
                value={`${response.overall.netScore >= 0 ? '+' : ''}${response.overall.netScore}점`}
                colorToken={response.overall.netScore >= 0 ? 'green' : 'red'}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {response.classes.map((classSummary, index) => (
                <SharedClassAnalyticsCard
                  key={classSummary.classNumber}
                  summary={classSummary}
                  index={index}
                  isExpanded={expandedClass === classSummary.classNumber}
                  emptyDescription={emptyCardDescription}
                  onToggle={() =>
                    setExpandedClass(
                      expandedClass === classSummary.classNumber
                        ? null
                        : classSummary.classNumber,
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
