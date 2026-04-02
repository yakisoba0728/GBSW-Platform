'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Card,
  FilterRow,
  NoticeBox,
  ScoreSummaryBar,
  SectionHeader,
  SectionTitle,
  SCHOOL_OPTIONS,
  StatCard,
  formatAwardedAtParts,
  formatSignedScore,
  inputStyle,
} from './teacher-shared'
import {
  AnimatedListItem,
  AnimatedTableRow,
  ListEmptyState,
  ListSkeleton,
  TableRowSkeleton,
} from '../ui/list'
import type {
  PaginatedSchoolMileageHistoryResponse,
  SchoolCode,
  SchoolMileageHistoryItem,
  SchoolMileageStudentOption,
  StudentMileageSummary,
} from './school-mileage-types'

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export default function SchoolMileageStudentView() {
  const [filterSchool, setFilterSchool] = useState<SchoolCode | ''>('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterName, setFilterName] = useState('')

  const [students, setStudents] = useState<SchoolMileageStudentOption[]>([])
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentEntries, setStudentEntries] = useState<SchoolMileageHistoryItem[]>([])
  const [totalEntryCount, setTotalEntryCount] = useState(0)
  const [isEntriesLoading, setIsEntriesLoading] = useState(false)

  const abortStudentsRef = useRef<AbortController | null>(null)
  const abortEntriesRef = useRef<AbortController | null>(null)

  const loadStudents = useCallback(async () => {
    if (!filterSchool) {
      setStudents([])
      setStudentsError('학교를 먼저 선택해주세요.')
      return
    }
    abortStudentsRef.current?.abort()
    const ctrl = new AbortController()
    abortStudentsRef.current = ctrl

    setIsStudentsLoading(true)
    setStudentsError(null)
    setSelectedStudentId(null)
    setStudentEntries([])

    try {
      const params = new URLSearchParams({ school: filterSchool })
      if (filterGrade) params.set('year', filterGrade)
      if (filterClass) params.set('classNumber', filterClass)
      if (filterName.trim()) params.set('name', filterName.trim())

      const res = await fetch(`/api/teacher/school-mileage/students?${params.toString()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setStudentsError(data?.message ?? '학생 목록을 불러오지 못했습니다.')
        setStudents([])
      } else {
        setStudents(Array.isArray(data?.students) ? data.students : [])
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setStudentsError('학생 목록 조회 중 문제가 발생했습니다.')
      }
    } finally {
      setIsStudentsLoading(false)
      setHasSearched(true)
    }
  }, [filterSchool, filterGrade, filterClass, filterName])

  const loadStudentEntries = useCallback(async (student: SchoolMileageStudentOption) => {
    abortEntriesRef.current?.abort()
    const ctrl = new AbortController()
    abortEntriesRef.current = ctrl

    setIsEntriesLoading(true)
    setStudentEntries([])
    setTotalEntryCount(0)

    try {
      const params = new URLSearchParams({
        studentName: student.name,
        pageSize: '500',
        page: '1',
      })
      if (filterSchool) params.set('school', filterSchool)

      const res = await fetch(`/api/teacher/school-mileage/entries?${params.toString()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      const data: PaginatedSchoolMileageHistoryResponse = await res.json().catch(() => ({ items: [], page: 1, pageSize: 500, totalCount: 0 }))
      if (res.ok) {
        setStudentEntries(Array.isArray(data.items) ? data.items : [])
        setTotalEntryCount(data.totalCount ?? 0)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setStudentEntries([])
      }
    } finally {
      setIsEntriesLoading(false)
    }
  }, [filterSchool])

  const handleSelectStudent = useCallback((student: SchoolMileageStudentOption) => {
    setSelectedStudentId(student.studentId)
    void loadStudentEntries(student)
  }, [loadStudentEntries])

  const selectedStudent = useMemo(
    () => students.find((s) => s.studentId === selectedStudentId) ?? null,
    [students, selectedStudentId],
  )

  const summary = useMemo((): StudentMileageSummary | null => {
    if (!selectedStudent) return null
    const reward = studentEntries
      .filter((e) => e.type === 'reward')
      .reduce((acc, e) => acc + e.score, 0)
    const penalty = studentEntries
      .filter((e) => e.type === 'penalty')
      .reduce((acc, e) => acc + e.score, 0)
    return {
      ...selectedStudent,
      rewardTotal: reward,
      penaltyTotal: penalty,
      netScore: reward - penalty,
      entryCount: studentEntries.length,
    }
  }, [selectedStudent, studentEntries])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortStudentsRef.current?.abort()
      abortEntriesRef.current?.abort()
    }
  }, [])

  const handleSearch = () => { void loadStudents() }

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          title="학생별 조회"
          subtitle="학생을 검색하고 선택하면 누적 상벌점 요약과 처리 내역을 확인할 수 있습니다."
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

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="rounded-lg border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">전체 반</option>
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <option key={c} value={String(c)}>{c}반</option>
              ))}
            </select>

            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="학생 이름 검색"
              className="rounded-lg border px-3 py-2 text-xs outline-none"
              style={{ ...inputStyle, minWidth: '120px' }}
            />

            <button
              type="button"
              onClick={handleSearch}
              disabled={!filterSchool}
              className="rounded-lg px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                backgroundColor: 'var(--admin-accent)',
                color: '#fff',
              }}
            >
              조회
            </button>
          </FilterRow>
        </div>
      </Card>

      {studentsError && !isStudentsLoading && hasSearched && (
        <NoticeBox type="error" message={studentsError} />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
        {/* 학생 목록 */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <p className="text-xs font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
              학생 목록
              {students.length > 0 && (
                <span className="ml-1.5" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  ({students.length}명)
                </span>
              )}
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-3">
            {isStudentsLoading ? (
              <ListSkeleton count={8} rowHeight="h-14" />
            ) : !hasSearched ? (
              <ListEmptyState
                icon={<UserIcon />}
                title="학교를 선택하고 조회하세요"
              />
            ) : students.length === 0 ? (
              <ListEmptyState
                icon={<UserIcon />}
                title="학생이 없습니다"
                description="검색 조건을 변경해 보세요."
              />
            ) : (
              <div className="space-y-1.5">
                {students.map((student, i) => {
                  const isSelected = selectedStudentId === student.studentId
                  return (
                    <AnimatedListItem key={student.studentId} index={i}>
                      <button
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors"
                        style={{
                          borderColor: isSelected ? 'var(--admin-accent)' : 'var(--admin-border)',
                          backgroundColor: isSelected ? 'var(--admin-accent-bg)' : 'transparent',
                        }}
                      >
                        <div
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: isSelected ? 'var(--admin-accent)' : 'var(--admin-border)',
                            color: isSelected ? '#fff' : 'var(--admin-text-muted)',
                            fontFamily: 'var(--font-space-grotesk)',
                          }}
                        >
                          {student.studentNumber}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
                            {student.name}
                          </p>
                          <p className="text-[11px]" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                            {student.grade !== null ? `${student.grade}학년 ` : ''}{student.classNumber}반
                          </p>
                        </div>
                        {isSelected && (
                          <div style={{ color: 'var(--admin-accent)' }}>
                            <ChevronRightIcon />
                          </div>
                        )}
                      </button>
                    </AnimatedListItem>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* 상세 패널 */}
        {!selectedStudentId ? (
          <Card>
            <ListEmptyState
              icon={<UserIcon />}
              title="학생을 선택하세요"
              description="좌측 목록에서 학생을 클릭하면 누적 점수와 처리 내역이 표시됩니다."
            />
          </Card>
        ) : (
          <div className="animate-fade-in space-y-4">
            {/* 요약 카드 */}
            {isEntriesLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative overflow-hidden rounded-xl border h-24" style={{ borderColor: 'var(--admin-border)', backgroundColor: 'var(--admin-sidebar-bg)' }}>
                    <div className="absolute inset-0 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)' }} />
                  </div>
                ))}
              </div>
            ) : summary ? (
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
                  <p className="text-xs font-medium mb-3" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                    상점 / 벌점 비율
                  </p>
                  <ScoreSummaryBar reward={summary.rewardTotal} penalty={summary.penaltyTotal} />
                </Card>
              </>
            ) : null}

            {totalEntryCount > 500 && (
              <NoticeBox type="error" message="데이터가 많아 최근 500건만 표시됩니다. 정확한 집계를 위해 기간 필터를 사용하세요." />
            )}

            {/* 상세 내역 테이블 */}
            <Card className="overflow-hidden p-0">
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <SectionTitle>
                  {selectedStudent?.name} 상벌점 내역
                  {studentEntries.length > 0 && (
                    <span className="ml-1.5 font-normal text-xs" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>
                      ({studentEntries.length}건)
                    </span>
                  )}
                </SectionTitle>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)' }}>
                      {['유형', '카테고리', '항목', '점수', '사유', '일시'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isEntriesLoading ? (
                      <TableRowSkeleton columns={6} count={5} />
                    ) : studentEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <ListEmptyState title="처리 내역이 없습니다" description="이 학생에게 아직 부여된 상벌점이 없습니다." />
                        </td>
                      </tr>
                    ) : (
                      studentEntries.map((entry, i) => {
                        const { date, time } = formatAwardedAtParts(entry.awardedAt)
                        return (
                          <AnimatedTableRow
                            key={entry.id}
                            index={i}
                            style={{ borderBottom: '1px solid var(--admin-border)' }}
                          >
                            <td className="px-3 py-2.5">
                              <Badge type={entry.type}>{entry.type === 'reward' ? '상점' : '벌점'}</Badge>
                            </td>
                            <td className="px-3 py-2.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                              {entry.ruleCategory}
                            </td>
                            <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                              {entry.ruleName}
                            </td>
                            <td className="px-3 py-2.5 font-semibold" style={{
                              fontFamily: 'var(--font-space-grotesk)',
                              color: entry.type === 'reward' ? '#16a34a' : '#dc2626',
                            }}>
                              {formatSignedScore(entry.type, entry.score)}
                            </td>
                            <td className="px-3 py-2.5 max-w-[180px] truncate" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                              {entry.reason ?? '—'}
                            </td>
                            <td className="px-3 py-2.5" style={{ color: 'var(--admin-text-muted)' }}>
                              <span style={{ fontFamily: 'var(--font-space-grotesk)' }}>{date}</span>
                              {time && <span className="ml-1 text-[10px]" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>{time}</span>}
                            </td>
                          </AnimatedTableRow>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
