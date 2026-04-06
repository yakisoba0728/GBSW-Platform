'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import {
  Card,
  FilterRow,
  NoticeBox,
  SCHOOL_OPTIONS,
  SectionHeader,
  StatCard,
  inputStyle,
} from '../mileage/shared'
import SuccessModal from '../ui/success-modal'
import { Button } from '../ui/button'
import { AnimatedListItem, ListEmptyState } from '../ui/list'
import { BuildingIcon } from '../ui/icons'
import type {
  ClassMileageAnalyticsResponse,
  ClassMileageSummary,
  SchoolCode,
  StudentMileageSummary,
} from './school-mileage-types'
import { getQueryString, useUpdateSearchParams } from '@/lib/url-state'

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 250ms ease',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function StudentRow({
  student,
  rank,
  colorToken,
}: {
  student: StudentMileageSummary
  rank: number
  colorToken: 'green' | 'red'
}) {
  const color = colorToken === 'green' ? 'var(--reward)' : 'var(--penalty)'
  const bg = colorToken === 'green' ? 'var(--reward-subtle)' : 'var(--penalty-subtle)'
  return (
    <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ backgroundColor: 'var(--bg)' }}>
      <span
        className="h-5 w-5 flex-shrink-0 rounded-full text-center text-[10px] font-bold leading-5"
        style={{ backgroundColor: bg, color, fontFamily: 'var(--font-space-grotesk)' }}
      >
        {rank}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-xs font-medium"
        style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg)' }}
      >
        {student.name}
      </span>
      <span
        className="flex-shrink-0 text-xs font-semibold"
        style={{ fontFamily: 'var(--font-space-grotesk)', color }}
      >
        {student.netScore >= 0 ? '+' : ''}{student.netScore}점
      </span>
    </div>
  )
}

function ClassCard({
  summary,
  isExpanded,
  onToggle,
  index,
}: {
  summary: ClassMileageSummary
  isExpanded: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <AnimatedListItem index={index}>
      <Card className="overflow-hidden p-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-full px-4 pb-3 pt-4 text-left transition-colors hover:opacity-90"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'var(--fg)',
                }}
              >
                {summary.classNumber}반
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  backgroundColor: 'var(--border)',
                  color: 'var(--fg-muted)',
                }}
              >
                {summary.studentCount}명
              </span>
            </div>
            <div style={{ color: 'var(--fg-muted)' }}>
              <ChevronDownIcon open={isExpanded} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-md px-3 py-2" style={{ backgroundColor: 'var(--reward-subtle)', border: '1px solid var(--reward-border)' }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--reward)' }}>상점 합계</p>
              <p className="mt-0.5 text-base font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--reward)' }}>+{summary.rewardTotal}</p>
            </div>
            <div className="rounded-md px-3 py-2" style={{ backgroundColor: 'var(--penalty-subtle)', border: '1px solid var(--penalty-border)' }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--penalty)' }}>벌점 합계</p>
              <p className="mt-0.5 text-base font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--penalty)' }}>-{summary.penaltyTotal}</p>
            </div>
            <div className="rounded-md px-3 py-2" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fg-muted)' }}>순점수 합</p>
              <p className="mt-0.5 text-base font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: summary.netScore >= 0 ? 'var(--reward)' : 'var(--penalty)' }}>
                {summary.netScore >= 0 ? '+' : ''}{summary.netScore}
              </p>
            </div>
            <div className="rounded-md px-3 py-2" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fg-muted)' }}>1인 평균</p>
              <p className="mt-0.5 text-base font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: summary.avgNetScore >= 0 ? 'var(--reward)' : 'var(--penalty)' }}>
                {summary.avgNetScore >= 0 ? '+' : ''}{summary.avgNetScore}
              </p>
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
            >
              <div className="px-4 pb-4 pt-1">
                {summary.topStudents.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--reward)' }}>상위 학생</p>
                    <div className="space-y-1">
                      {summary.topStudents.map((student, index) => (
                        <StudentRow key={student.studentId} student={student} rank={index + 1} colorToken="green" />
                      ))}
                    </div>
                  </div>
                )}
                {summary.bottomStudents.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--penalty)' }}>주의 학생</p>
                    <div className="space-y-1">
                      {summary.bottomStudents.map((student, index) => (
                        <StudentRow key={student.studentId} student={student} rank={index + 1} colorToken="red" />
                      ))}
                    </div>
                  </div>
                )}
                {summary.topStudents.length === 0 && summary.bottomStudents.length === 0 && (
                  <p className="mt-3 py-2 text-center text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg-muted)' }}>
                    이 반에 상벌점 내역이 없습니다.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </AnimatedListItem>
  )
}

const EMPTY_RESPONSE: ClassMileageAnalyticsResponse = {
  classes: [],
  overall: {
    classCount: 0,
    totalStudents: 0,
    rewardTotal: 0,
    penaltyTotal: 0,
    netScore: 0,
  },
}

export default function SchoolMileageClass() {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const filterSchool = getQueryString(searchParams, 'school') as SchoolCode | ''
  const filterGrade = getQueryString(searchParams, 'year')

  const [response, setResponse] =
    useState<ClassMileageAnalyticsResponse>(EMPTY_RESPONSE)
  const [isLoading, setIsLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [showQueryErrorModal, setShowQueryErrorModal] = useState(false)
  const [expandedClass, setExpandedClass] = useState<number | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const loadClassData = useCallback(async () => {
    if (!filterSchool) {
      abortRef.current?.abort()
      abortRef.current = null
      setResponse(EMPTY_RESPONSE)
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
      const params = new URLSearchParams({ school: filterSchool })
      if (filterGrade) {
        params.set('year', filterGrade)
      }

      const res = await fetch(
        `/api/teacher/school-mileage/analytics/classes?${params.toString()}`,
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
        setQueryError(data?.message ?? '학급 현황 데이터를 불러오지 못했습니다.')
        setShowQueryErrorModal(true)
        setResponse(EMPTY_RESPONSE)
        return
      }

      setResponse({
        classes: Array.isArray(data?.classes)
          ? (data.classes as ClassMileageSummary[])
          : [],
        overall: data?.overall ?? EMPTY_RESPONSE.overall,
      })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setQueryError('학급 현황 조회 중 문제가 발생했습니다.')
        setShowQueryErrorModal(true)
        setResponse(EMPTY_RESPONSE)
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null
        setIsLoading(false)
      }
    }
  }, [filterGrade, filterSchool])

  useEffect(() => {
    void loadClassData()

    return () => {
      abortRef.current?.abort()
    }
  }, [loadClassData])

  return (
    <div className="flex flex-col h-full gap-4">
      <Card>
        <SectionHeader
          title="학급별 현황"
          subtitle="반별 상점·벌점 합계와 학생 현황을 비교합니다. 카드를 클릭하면 상위·주의 학생을 확인할 수 있습니다."
        />
        <div className="mt-4">
          <FilterRow>
            <select
              value={filterSchool}
              onChange={(event) => updateSearchParams({ school: event.target.value, year: filterGrade })}
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={inputStyle}
            >
              <option value="">학교 선택</option>
              {SCHOOL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={filterGrade}
              onChange={(event) => updateSearchParams({ year: event.target.value })}
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={inputStyle}
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>

            <Button variant="primary" size="sm" loading={isLoading} disabled={isLoading || !filterSchool} onClick={() => void loadClassData()}>새로고침</Button>
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

      {queryError && (
        <NoticeBox
          type="error"
          message={queryError}
        />
      )}

      <div className="flex flex-1 min-h-0 flex-col gap-4">

      {!filterSchool && !isLoading && (
        <Card className="flex flex-1 flex-col">
          <ListEmptyState
            fill
            icon={<BuildingIcon style={{ color: 'var(--accent)' }} />}
            title="학교를 선택하세요"
            description="학교·학년 조건을 설정하면 학급별 현황이 표시됩니다."
          />
        </Card>
      )}

      {isLoading && filterSchool && (
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

      {filterSchool &&
        !isLoading &&
        response.classes.length === 0 &&
        !queryError && (
          <Card className="flex flex-1 flex-col">
            <ListEmptyState
              fill
              icon={<BuildingIcon style={{ color: 'var(--accent)' }} />}
              title="학급 데이터가 없습니다"
              description="다른 조건으로 다시 조회해 보세요."
            />
          </Card>
        )}

      {response.classes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard
              label="총 학급 수"
              value={`${response.overall.classCount}개`}
            />
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
              <ClassCard
                key={classSummary.classNumber}
                summary={classSummary}
                index={index}
                isExpanded={expandedClass === classSummary.classNumber}
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
