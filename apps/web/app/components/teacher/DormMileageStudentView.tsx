'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, FilterRow, NoticeBox, SectionHeader, inputStyle } from '../mileage/shared'
import SuccessModal from '../ui/success-modal'
import {
  AnimatedListItem,
  ListEmptyState,
  LoadingSpinner,
} from '../ui/list'
import { ChevronRightIcon, UserIcon } from '../ui/icons'
import { Button } from '../ui/button'
import type {
  PaginatedDormMileageHistoryResponse,
  DormMileageHistoryItem,
  DormMileageStudentOption,
  DormStudentMileageSummary,
  DormStudentMileageSummaryResponse,
} from './dorm-mileage-types'
import type {
  SchoolMileageHistoryItem,
  StudentMileageSummary,
} from './school-mileage-types'
import StudentEntriesTable from './StudentEntriesTable'
import StudentSummaryCards from './StudentSummaryCards'
import {
  getPositiveQueryNumber,
  getQueryString,
  useUpdateSearchParams,
} from '@/lib/url-state'

const EMPTY_ENTRY_RESPONSE: PaginatedDormMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

export default function DormMileageStudentView() {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()

  const filterGrade = getQueryString(searchParams, 'year')
  const filterClass = getQueryString(searchParams, 'classNumber')
  const filterName = getQueryString(searchParams, 'name')
  const selectedStudentId = getQueryString(searchParams, 'studentId') || null
  const page = getPositiveQueryNumber(searchParams, 'page', 1)
  const pageSize = getPositiveQueryNumber(searchParams, 'pageSize', 20)

  const [students, setStudents] = useState<DormMileageStudentOption[]>([])
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  const [summary, setSummary] = useState<DormStudentMileageSummary | null>(null)
  const [studentEntries, setStudentEntries] = useState<DormMileageHistoryItem[]>([])
  const [totalEntryCount, setTotalEntryCount] = useState(0)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [isEntriesLoading, setIsEntriesLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const combinedError = studentsError || detailError
  const [showErrorModal, setShowErrorModal] = useState(false)

  const abortStudentsRef = useRef<AbortController | null>(null)
  const abortSummaryRef = useRef<AbortController | null>(null)
  const abortEntriesRef = useRef<AbortController | null>(null)

  const loadStudents = useCallback(async () => {
    abortStudentsRef.current?.abort()
    const ctrl = new AbortController()
    abortStudentsRef.current = ctrl

    setIsStudentsLoading(true)
    setStudentsError(null)

    try {
      const params = new URLSearchParams()
      if (filterGrade) params.set('year', filterGrade)
      if (filterClass) params.set('classNumber', filterClass)
      if (filterName.trim()) params.set('name', filterName.trim())

      const res = await fetch(
        `/api/teacher/dorm-mileage/students?${params.toString()}`,
        {
          signal: ctrl.signal,
          cache: 'no-store',
        },
      )
      const data = await res.json().catch(() => null)

      if (abortStudentsRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if (!res.ok) {
        setStudentsError(data?.message ?? '학생 목록을 불러오지 못했습니다.')
        setShowErrorModal(true)
        setStudents([])
        return
      }

      setStudents(Array.isArray(data?.students) ? data.students : [])
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setStudentsError('학생 목록 조회 중 문제가 발생했습니다.')
        setShowErrorModal(true)
        setStudents([])
      }
    } finally {
      if (abortStudentsRef.current === ctrl) {
        abortStudentsRef.current = null
        setIsStudentsLoading(false)
      }
    }
  }, [filterClass, filterGrade, filterName])

  const loadStudentSummary = useCallback(async () => {
    if (!selectedStudentId) {
      setSummary(null)
      setDetailError(null)
      return
    }

    abortSummaryRef.current?.abort()
    const ctrl = new AbortController()
    abortSummaryRef.current = ctrl

    setIsSummaryLoading(true)
    setDetailError(null)

    try {
      const res = await fetch(
        `/api/teacher/dorm-mileage/students/${encodeURIComponent(selectedStudentId)}/summary`,
        {
          signal: ctrl.signal,
          cache: 'no-store',
        },
      )
      const data: DormStudentMileageSummaryResponse | null = await res
        .json()
        .catch(() => null)

      if (abortSummaryRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if (!res.ok) {
        setDetailError(
          (data as { message?: string } | null)?.message ??
            '학생 요약을 불러오지 못했습니다.',
        )
        setShowErrorModal(true)
        setSummary(null)
        return
      }

      setSummary(data?.summary ?? null)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setDetailError('학생 요약 조회 중 문제가 발생했습니다.')
        setShowErrorModal(true)
        setSummary(null)
      }
    } finally {
      if (abortSummaryRef.current === ctrl) {
        abortSummaryRef.current = null
        setIsSummaryLoading(false)
      }
    }
  }, [selectedStudentId])

  const loadStudentEntries = useCallback(async () => {
    if (!selectedStudentId) {
      setStudentEntries([])
      setTotalEntryCount(0)
      return
    }

    abortEntriesRef.current?.abort()
    const ctrl = new AbortController()
    abortEntriesRef.current = ctrl

    setIsEntriesLoading(true)

    try {
      const params = new URLSearchParams({
        studentId: selectedStudentId,
        page: `${page}`,
        pageSize: `${pageSize}`,
      })

      const res = await fetch(
        `/api/teacher/dorm-mileage/entries?${params.toString()}`,
        {
          signal: ctrl.signal,
          cache: 'no-store',
        },
      )
      const data: PaginatedDormMileageHistoryResponse = await res
        .json()
        .catch(() => EMPTY_ENTRY_RESPONSE)

      if (abortEntriesRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if (!res.ok) {
        setDetailError('학생 처리 내역을 불러오지 못했습니다.')
        setShowErrorModal(true)
        setStudentEntries([])
        setTotalEntryCount(0)
        return
      }

      setStudentEntries(Array.isArray(data.items) ? data.items : [])
      setTotalEntryCount(data.totalCount ?? 0)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setDetailError('학생 처리 내역 조회 중 문제가 발생했습니다.')
        setShowErrorModal(true)
        setStudentEntries([])
        setTotalEntryCount(0)
      }
    } finally {
      if (abortEntriesRef.current === ctrl) {
        abortEntriesRef.current = null
        setIsEntriesLoading(false)
      }
    }
  }, [page, pageSize, selectedStudentId])

  useEffect(() => {
    void loadStudents()

    return () => {
      abortStudentsRef.current?.abort()
    }
  }, [loadStudents])

  useEffect(() => {
    void loadStudentSummary()

    return () => {
      abortSummaryRef.current?.abort()
    }
  }, [loadStudentSummary])

  useEffect(() => {
    void loadStudentEntries()

    return () => {
      abortEntriesRef.current?.abort()
    }
  }, [loadStudentEntries])

  const selectedStudent = useMemo(
    () => students.find((student) => student.studentId === selectedStudentId) ?? null,
    [selectedStudentId, students],
  )

  const pageCount = Math.max(1, Math.ceil(totalEntryCount / pageSize))

  // StudentSummaryCards expects StudentMileageSummary (with school).
  // Dorm entries are GBSW-only, so we inject the field for compatibility.
  const summaryCompat = useMemo(
    () =>
      summary
        ? ({ ...summary, school: 'GBSW' as const } as StudentMileageSummary)
        : null,
    [summary],
  )

  // StudentEntriesTable expects SchoolMileageHistoryItem (with school).
  const entriesCompat = useMemo(
    () =>
      studentEntries.map((item) => ({
        ...item,
        school: 'GBSW' as const,
      })) as SchoolMileageHistoryItem[],
    [studentEntries],
  )

  return (
    <div className="flex flex-col h-full gap-4">
      <Card>
        <SectionHeader
          title="학생별 조회"
          subtitle="학생을 검색하고 선택하면 누적 기숙사 상벌점 요약과 처리 내역을 확인할 수 있습니다."
        />
        <div className="mt-4">
          <FilterRow>
            <select
              value={filterGrade}
              onChange={(event) =>
                updateSearchParams({
                  year: event.target.value,
                  studentId: null,
                  page: null,
                  pageSize: null,
                })
              }
              className="h-9 rounded-lg border px-3 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>

            <select
              value={filterClass}
              onChange={(event) =>
                updateSearchParams({
                  classNumber: event.target.value,
                  studentId: null,
                  page: null,
                  pageSize: null,
                })
              }
              className="h-9 rounded-lg border px-3 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">전체 반</option>
              {[1, 2, 3, 4, 5, 6].map((classNumber) => (
                <option key={classNumber} value={String(classNumber)}>
                  {classNumber}반
                </option>
              ))}
            </select>

            <input
              type="text"
              value={filterName}
              onChange={(event) =>
                updateSearchParams({
                  name: event.target.value,
                  studentId: null,
                  page: null,
                  pageSize: null,
                })
              }
              placeholder="학생 이름 검색"
              className="h-9 rounded-lg border px-3 text-xs outline-none"
              style={{ ...inputStyle, minWidth: '120px' }}
            />

            <Button
              variant="primary"
              size="sm"
              loading={isStudentsLoading}
              disabled={isStudentsLoading}
              onClick={() => {
                void loadStudents()
                void loadStudentSummary()
                void loadStudentEntries()
              }}
            >
              새로고침
            </Button>
          </FilterRow>
        </div>
      </Card>

      <SuccessModal
        open={showErrorModal && !!combinedError}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="데이터 조회 실패"
        description={combinedError ?? ''}
      />
      {studentsError && <NoticeBox type="error" message={studentsError} />}
      {detailError && <NoticeBox type="error" message={detailError} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr] flex-1 min-h-0">
        <Card className="overflow-hidden p-0 flex flex-col min-h-0">
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <p
              className="text-xs font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg-muted)',
              }}
            >
              학생 목록
              {students.length > 0 && (
                <span
                  className="ml-1.5"
                  style={{ fontFamily: 'var(--font-space-grotesk)' }}
                >
                  ({students.length}명)
                </span>
              )}
            </p>
          </div>
          <div className="flex-1 min-h-0 p-3">
            {isStudentsLoading ? (
              <div className="flex h-full min-h-[120px] items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {studentsError ? (
                  <div className="flex h-full items-center justify-center">
                    <ListEmptyState
                      fill
                      icon={<UserIcon style={{ color: 'var(--accent)' }} />}
                      title="학생 목록을 불러오지 못했습니다"
                      description={studentsError}
                    />
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <ListEmptyState
                      fill
                      icon={<UserIcon style={{ color: 'var(--accent)' }} />}
                      title="학생이 없습니다"
                      description="검색 조건을 변경해 보세요."
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {students.map((student, index) => {
                      const isSelected = selectedStudentId === student.studentId

                      return (
                        <AnimatedListItem key={student.studentId} index={index}>
                          <button
                            type="button"
                            onClick={() =>
                              updateSearchParams({
                                studentId: student.studentId,
                                page: 1,
                                pageSize: 20,
                              })
                            }
                            className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors"
                            style={{
                              borderColor: isSelected
                                ? 'var(--accent)'
                                : 'var(--border)',
                              backgroundColor: isSelected
                                ? 'var(--accent-subtle)'
                                : 'transparent',
                            }}
                          >
                            <div
                              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: isSelected
                                  ? 'var(--accent)'
                                  : 'var(--border)',
                                color: isSelected ? '#fff' : 'var(--fg-muted)',
                                fontFamily: 'var(--font-space-grotesk)',
                              }}
                            >
                              {student.studentNumber}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-sm font-medium"
                                style={{
                                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                                  color: 'var(--fg)',
                                }}
                              >
                                {student.name}
                              </p>
                              <p
                                className="text-[11px]"
                                style={{
                                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                                  color: 'var(--fg-muted)',
                                }}
                              >
                                {student.grade !== null ? `${student.grade}학년 ` : ''}
                                {student.classNumber}반
                              </p>
                            </div>
                            {isSelected && (
                              <div style={{ color: 'var(--accent)' }}>
                                <ChevronRightIcon />
                              </div>
                            )}
                          </button>
                        </AnimatedListItem>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </Card>

        {!selectedStudentId ? (
          <Card className="flex flex-col flex-1 min-h-0">
            <ListEmptyState
              fill
              icon={<UserIcon style={{ color: 'var(--accent)' }} />}
              title="학생을 선택하세요"
              description="좌측 목록에서 학생을 클릭하면 누적 점수와 처리 내역이 표시됩니다."
            />
          </Card>
        ) : detailError && !summary && studentEntries.length === 0 && !isSummaryLoading && !isEntriesLoading ? (
          <Card className="flex flex-col flex-1 min-h-0">
            <ListEmptyState
              fill
              icon={<UserIcon style={{ color: 'var(--accent)' }} />}
              title="학생 정보를 불러오지 못했습니다"
              description={detailError}
            />
          </Card>
        ) : (
          <div className="flex flex-col min-h-0 gap-4 overflow-hidden">
            <StudentSummaryCards summary={summaryCompat} isLoading={isSummaryLoading} />

            <StudentEntriesTable
              studentName={summary?.name ?? selectedStudent?.name ?? '학생'}
              entries={entriesCompat}
              isLoading={isEntriesLoading}
              totalEntryCount={totalEntryCount}
              page={page}
              pageCount={pageCount}
              onPageChange={(nextPage) =>
                updateSearchParams({
                  page: nextPage,
                  pageSize,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
