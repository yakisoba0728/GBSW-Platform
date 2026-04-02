'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Card,
  FilterRow,
  NoticeBox,
  SectionHeader,
  SCHOOL_OPTIONS,
  StatCard,
  inputStyle,
} from './teacher-shared'
import { AnimatedListItem, ListEmptyState } from '../ui/list'
import type {
  ClassMileageSummary,
  SchoolCode,
  SchoolMileageHistoryItem,
  SchoolMileageStudentOption,
  StudentMileageSummary,
} from './school-mileage-types'

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M16 11h.01" />
    </svg>
  )
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 250ms ease' }}
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
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--admin-bg)' }}>
      <span
        className="h-5 w-5 flex-shrink-0 rounded-full text-center text-[10px] font-bold leading-5"
        style={{
          backgroundColor: colorToken === 'green' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: colorToken === 'green' ? '#16a34a' : '#dc2626',
          fontFamily: 'var(--font-space-grotesk)',
        }}
      >
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
        {student.name}
      </span>
      <span
        className="flex-shrink-0 text-xs font-semibold"
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          color: colorToken === 'green' ? '#16a34a' : '#dc2626',
        }}
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
      <Card className="p-0 overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left px-4 pt-4 pb-3 transition-colors hover:opacity-90"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text)' }}
              >
                {summary.classNumber}반
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  backgroundColor: 'var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {summary.studentCount}명
              </span>
            </div>
            <div style={{ color: 'var(--admin-text-muted)' }}>
              <ChevronDownIcon open={isExpanded} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-[10px]" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: '#16a34a' }}>상점 합계</p>
              <p className="mt-0.5 text-lg font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: '#16a34a' }}>+{summary.rewardTotal}</p>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[10px]" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: '#dc2626' }}>벌점 합계</p>
              <p className="mt-0.5 text-lg font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: '#dc2626' }}>-{summary.penaltyTotal}</p>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
              <p className="text-[10px]" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>순점수 합</p>
              <p
                className="mt-0.5 text-lg font-semibold"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: summary.netScore >= 0 ? '#16a34a' : '#dc2626',
                }}
              >
                {summary.netScore >= 0 ? '+' : ''}{summary.netScore}
              </p>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
              <p className="text-[10px]" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>1인 평균</p>
              <p
                className="mt-0.5 text-lg font-semibold"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: summary.avgNetScore >= 0 ? '#16a34a' : '#dc2626',
                }}
              >
                {summary.avgNetScore >= 0 ? '+' : ''}{summary.avgNetScore}
              </p>
            </div>
          </div>
        </button>

        {/* Accordion 펼침 */}
        {isExpanded && (
          <div className="animate-slide-down px-4 pb-4 pt-1" style={{ borderTop: '1px solid var(--admin-border)' }}>
            {summary.topStudents.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-[11px] font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: '#16a34a' }}>
                  상위 학생
                </p>
                <div className="space-y-1">
                  {summary.topStudents.map((s, i) => (
                    <StudentRow key={s.studentId} student={s} rank={i + 1} colorToken="green" />
                  ))}
                </div>
              </div>
            )}
            {summary.bottomStudents.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-[11px] font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: '#dc2626' }}>
                  주의 학생
                </p>
                <div className="space-y-1">
                  {summary.bottomStudents.map((s, i) => (
                    <StudentRow key={s.studentId} student={s} rank={i + 1} colorToken="red" />
                  ))}
                </div>
              </div>
            )}
            {summary.topStudents.length === 0 && summary.bottomStudents.length === 0 && (
              <p className="mt-3 text-center text-xs py-2" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                이 반에 상벌점 내역이 없습니다.
              </p>
            )}
          </div>
        )}
      </Card>
    </AnimatedListItem>
  )
}

export default function SchoolMileageClass() {
  const [filterSchool, setFilterSchool] = useState<SchoolCode | ''>('')
  const [filterGrade, setFilterGrade] = useState('')

  const [students, setStudents] = useState<SchoolMileageStudentOption[]>([])
  const [entries, setEntries] = useState<SchoolMileageHistoryItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasQueried, setHasQueried] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [expandedClass, setExpandedClass] = useState<number | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const loadClassData = useCallback(async () => {
    if (!filterSchool) {
      setQueryError('학교를 먼저 선택해주세요.')
      return
    }

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsLoading(true)
    setQueryError(null)
    setExpandedClass(null)

    try {
      const studentParams = new URLSearchParams({ school: filterSchool })
      if (filterGrade) studentParams.set('year', filterGrade)

      const entryParams = new URLSearchParams({ school: filterSchool, pageSize: '500', page: '1' })
      if (filterGrade) entryParams.set('year', filterGrade)

      const [studentsRes, entriesRes] = await Promise.allSettled([
        fetch(`/api/teacher/school-mileage/students?${studentParams.toString()}`, { signal: ctrl.signal, cache: 'no-store' }),
        fetch(`/api/teacher/school-mileage/entries?${entryParams.toString()}`, { signal: ctrl.signal, cache: 'no-store' }),
      ])

      if (studentsRes.status === 'fulfilled' && studentsRes.value.ok) {
        const data = await studentsRes.value.json().catch(() => null)
        setStudents(Array.isArray(data?.students) ? data.students : [])
      } else {
        setStudents([])
      }

      if (entriesRes.status === 'fulfilled' && entriesRes.value.ok) {
        const data = await entriesRes.value.json().catch(() => null)
        setEntries(Array.isArray(data?.items) ? data.items : [])
        setTotalCount(data?.totalCount ?? 0)
      } else {
        setEntries([])
        setTotalCount(0)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setQueryError('학급 현황 조회 중 문제가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
      setHasQueried(true)
    }
  }, [filterSchool, filterGrade])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const classSummaries = useMemo((): ClassMileageSummary[] => {
    if (students.length === 0) return []

    const classStudents = new Map<number, SchoolMileageStudentOption[]>()
    for (const s of students) {
      const arr = classStudents.get(s.classNumber) ?? []
      arr.push(s)
      classStudents.set(s.classNumber, arr)
    }

    const studentEntryMap = new Map<string, SchoolMileageHistoryItem[]>()
    for (const e of entries) {
      const arr = studentEntryMap.get(e.studentId) ?? []
      arr.push(e)
      studentEntryMap.set(e.studentId, arr)
    }

    return [...classStudents.entries()]
      .map(([classNumber, classStudentList]) => {
        const studentSummaries: StudentMileageSummary[] = classStudentList.map((s) => {
          const ents = studentEntryMap.get(s.studentId) ?? []
          const reward = ents.filter((e) => e.type === 'reward').reduce((acc, e) => acc + e.score, 0)
          const penalty = ents.filter((e) => e.type === 'penalty').reduce((acc, e) => acc + e.score, 0)
          return {
            ...s,
            rewardTotal: reward,
            penaltyTotal: penalty,
            netScore: reward - penalty,
            entryCount: ents.length,
          }
        })

        const rewardTotal = studentSummaries.reduce((acc, s) => acc + s.rewardTotal, 0)
        const penaltyTotal = studentSummaries.reduce((acc, s) => acc + s.penaltyTotal, 0)
        const netScore = rewardTotal - penaltyTotal
        const avgNetScore =
          studentSummaries.length > 0
            ? Math.round((netScore / studentSummaries.length) * 10) / 10
            : 0

        const sorted = [...studentSummaries].sort((a, b) => b.netScore - a.netScore)

        return {
          classNumber,
          studentCount: classStudentList.length,
          rewardTotal,
          penaltyTotal,
          netScore,
          avgNetScore,
          topStudents: sorted.slice(0, 3),
          bottomStudents: sorted.length > 3 ? sorted.slice(-3).reverse() : [],
        }
      })
      .sort((a, b) => a.classNumber - b.classNumber)
  }, [students, entries])

  const overallSummary = useMemo(() => {
    const rewardTotal = classSummaries.reduce((acc, c) => acc + c.rewardTotal, 0)
    const penaltyTotal = classSummaries.reduce((acc, c) => acc + c.penaltyTotal, 0)
    const totalStudents = classSummaries.reduce((acc, c) => acc + c.studentCount, 0)
    return { rewardTotal, penaltyTotal, netScore: rewardTotal - penaltyTotal, totalStudents, classCount: classSummaries.length }
  }, [classSummaries])

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          title="학급별 현황"
          subtitle="반별 상점·벌점 합계와 학생 현황을 비교합니다. 카드를 클릭하면 상위·주의 학생을 확인할 수 있습니다."
        />
        <div className="mt-4">
          <FilterRow>
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value as SchoolCode | '')}
              className="rounded-lg border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">학교 선택</option>
              {SCHOOL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="rounded-lg border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>

            <button
              type="button"
              onClick={() => { void loadClassData() }}
              disabled={isLoading || !filterSchool}
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
            icon={<BuildingIcon />}
            title="학교를 선택하고 조회하세요"
            description="학교·학년 조건을 설정하고 조회 버튼을 클릭하세요."
          />
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border h-40 relative" style={{ borderColor: 'var(--admin-border)', backgroundColor: 'var(--admin-sidebar-bg)' }}>
              <div className="absolute inset-0 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }} />
            </div>
          ))}
        </div>
      )}

      {hasQueried && !isLoading && classSummaries.length === 0 && !queryError && (
        <Card>
          <ListEmptyState
            icon={<BuildingIcon />}
            title="학급 데이터가 없습니다"
            description="다른 조건으로 다시 조회해 보세요."
          />
        </Card>
      )}

      {hasQueried && !isLoading && classSummaries.length > 0 && (
        <>
          {totalCount > 500 && (
            <NoticeBox type="error" message={`전체 ${totalCount}건 중 최근 500건만 기준으로 집계됩니다.`} />
          )}

          {/* 전체 요약 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="총 학급 수" value={`${overallSummary.classCount}개`} />
            <StatCard label="총 학생 수" value={`${overallSummary.totalStudents}명`} />
            <StatCard label="전체 상점 합계" value={`+${overallSummary.rewardTotal}점`} colorToken="green" />
            <StatCard label="전체 벌점 합계" value={`-${overallSummary.penaltyTotal}점`} colorToken="red" />
          </div>

          {/* 학급 카드 그리드 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classSummaries.map((cls, i) => (
              <ClassCard
                key={cls.classNumber}
                summary={cls}
                index={i}
                isExpanded={expandedClass === cls.classNumber}
                onToggle={() => setExpandedClass(expandedClass === cls.classNumber ? null : cls.classNumber)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
