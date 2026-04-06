'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, NoticeBox } from './teacher-shared'
import SuccessModal from '../ui/success-modal'
import {
  AnimatedListItem,
  ListEmptyState,
  ListSkeleton,
} from '../ui/list'
import { ChevronRightIcon, UserIcon } from '../ui/icons'
import type {
  PaginatedSchoolMileageHistoryResponse,
  SchoolCode,
  SchoolMileageHistoryItem,
  SchoolMileageStudentOption,
  StudentMileageSummary,
  StudentMileageSummaryResponse,
} from './school-mileage-types'
import StudentEntriesTable from './StudentEntriesTable'
import StudentSearchPanel from './StudentSearchPanel'
import StudentSummaryCards from './StudentSummaryCards'
import {
  getPositiveQueryNumber,
  getQueryString,
  useUpdateSearchParams,
} from '@/lib/url-state'

const EMPTY_ENTRY_RESPONSE: PaginatedSchoolMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

export default function SchoolMileageStudentView() {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()

  const filterSchool = getQueryString(searchParams, 'school') as SchoolCode | ''
  const filterGrade = getQueryString(searchParams, 'year')
  const filterClass = getQueryString(searchParams, 'classNumber')
  const filterName = getQueryString(searchParams, 'name')
  const selectedStudentId = getQueryString(searchParams, 'studentId') || null
  const page = getPositiveQueryNumber(searchParams, 'page', 1)
  const pageSize = getPositiveQueryNumber(searchParams, 'pageSize', 20)

  const [students, setStudents] = useState<SchoolMileageStudentOption[]>([])
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  const [summary, setSummary] = useState<StudentMileageSummary | null>(null)
  const [studentEntries, setStudentEntries] = useState<SchoolMileageHistoryItem[]>([])
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
    if (!filterSchool) {
      setStudents([])
      setStudentsError(null)
      return
    }

    abortStudentsRef.current?.abort()
    const ctrl = new AbortController()
    abortStudentsRef.current = ctrl

    setIsStudentsLoading(true)
    setStudentsError(null)

    try {
      const params = new URLSearchParams({ school: filterSchool })
      if (filterGrade) params.set('year', filterGrade)
      if (filterClass) params.set('classNumber', filterClass)
      if (filterName.trim()) params.set('name', filterName.trim())

      const res = await fetch(
        `/api/teacher/school-mileage/students?${params.toString()}`,
        {
          signal: ctrl.signal,
          cache: 'no-store',
        },
      )
      const data = await res.json().catch(() => null)

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
      setIsStudentsLoading(false)
    }
  }, [filterClass, filterGrade, filterName, filterSchool])

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
        `/api/teacher/school-mileage/students/${encodeURIComponent(selectedStudentId)}/summary`,
        {
          signal: ctrl.signal,
          cache: 'no-store',
        },
      )
      const data: StudentMileageSummaryResponse | null = await res
        .json()
        .catch(() => null)

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
      setIsSummaryLoading(false)
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
        `/api/teacher/school-mileage/entries?${params.toString()}`,
        {
          signal: ctrl.signal,
          cache: 'no-store',
        },
      )
      const data: PaginatedSchoolMileageHistoryResponse = await res
        .json()
        .catch(() => EMPTY_ENTRY_RESPONSE)

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
      setIsEntriesLoading(false)
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

  return (
    <div className="flex flex-col h-full gap-4">
      <StudentSearchPanel
        filterSchool={filterSchool}
        filterGrade={filterGrade}
        filterClass={filterClass}
        filterName={filterName}
        onSchoolChange={(value) =>
          updateSearchParams({
            school: value,
            year: filterGrade,
            classNumber: filterClass,
            name: filterName,
            studentId: null,
            page: null,
            pageSize: null,
          })
        }
        onGradeChange={(value) =>
          updateSearchParams({
            year: value,
            studentId: null,
            page: null,
            pageSize: null,
          })
        }
        onClassChange={(value) =>
          updateSearchParams({
            classNumber: value,
            studentId: null,
            page: null,
            pageSize: null,
          })
        }
        onNameChange={(value) =>
          updateSearchParams({
            name: value,
            studentId: null,
            page: null,
            pageSize: null,
          })
        }
        onReload={() => {
          void loadStudents()
          void loadStudentSummary()
          void loadStudentEntries()
        }}
        isLoading={isStudentsLoading}
      />

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
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {!filterSchool ? (
              <div className="flex h-full items-center justify-center">
                <ListEmptyState
                  fill
                  icon={<UserIcon style={{ color: 'var(--accent)' }} />}
                  title="학교를 선택하세요"
                  description="학교를 선택하면 학생 목록을 바로 불러옵니다."
                />
              </div>
            ) : isStudentsLoading ? (
              <ListSkeleton count={8} rowHeight="h-14" />
            ) : studentsError ? (
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
            <StudentSummaryCards summary={summary} isLoading={isSummaryLoading} />

            <StudentEntriesTable
              studentName={summary?.name ?? selectedStudent?.name ?? '학생'}
              entries={studentEntries}
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
