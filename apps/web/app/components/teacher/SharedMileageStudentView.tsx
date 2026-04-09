'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, NoticeBox } from '../mileage/shared'
import SuccessModal from '../ui/success-modal'
import {
  AnimatedListItem,
  ListEmptyState,
  LoadingSpinner,
} from '../ui/list'
import { ChevronRightIcon, UserFeatureIcon } from '../ui/icons'
import StudentEntriesTable from './StudentEntriesTable'
import StudentSearchPanel from './StudentSearchPanel'
import StudentSummaryCards from './StudentSummaryCards'
import type {
  SharedMileageHistoryItem,
  SharedMileageStudentOption,
  SharedPaginatedMileageHistoryResponse,
  SharedSchoolCode,
  SharedStudentMileageSummary,
} from './shared-mileage-types'
import {
  getPositiveQueryNumber,
  getQueryString,
  useUpdateSearchParams,
} from '@/lib/url-state'

type SharedMileageStudentViewProps<
  Item extends SharedMileageHistoryItem,
  Response extends SharedPaginatedMileageHistoryResponse<Item>,
> = {
  includeSchoolFilter?: boolean
  studentsPath: string
  summaryPath: (studentId: string) => string
  entriesPath: string
  studentsLoadErrorMessage: string
  studentsLoadCatchMessage: string
  summaryLoadErrorMessage: string
  summaryLoadCatchMessage: string
  entriesLoadErrorMessage: string
  entriesLoadCatchMessage: string
  studentListEmptyTitle: string
  studentListEmptyDescription: string
  studentListLoadTitle: string
  summaryEmptyTitle: string
  summaryEmptyDescription: string
  detailLoadTitle: string
  searchTitle: string
  searchSubtitle: string
  initialEntryResponse: Response
}

export default function SharedMileageStudentView<
  Student extends SharedMileageStudentOption,
  Summary extends SharedStudentMileageSummary,
  Item extends SharedMileageHistoryItem,
  Response extends SharedPaginatedMileageHistoryResponse<Item>,
>({
  includeSchoolFilter = false,
  studentsPath,
  summaryPath,
  entriesPath,
  studentsLoadErrorMessage,
  studentsLoadCatchMessage,
  summaryLoadErrorMessage,
  summaryLoadCatchMessage,
  entriesLoadErrorMessage,
  entriesLoadCatchMessage,
  studentListEmptyTitle,
  studentListEmptyDescription,
  studentListLoadTitle,
  summaryEmptyTitle,
  summaryEmptyDescription,
  detailLoadTitle,
  searchTitle,
  searchSubtitle,
  initialEntryResponse,
}: SharedMileageStudentViewProps<Item, Response>) {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()

  const filterSchool = includeSchoolFilter
    ? (getQueryString(searchParams, 'school') as SharedSchoolCode | '')
    : ''
  const filterGrade = getQueryString(searchParams, 'year')
  const filterClass = getQueryString(searchParams, 'classNumber')
  const filterName = getQueryString(searchParams, 'name')
  const selectedStudentId = getQueryString(searchParams, 'studentId') || null
  const page = getPositiveQueryNumber(searchParams, 'page', 1)
  const pageSize = getPositiveQueryNumber(searchParams, 'pageSize', 20)

  const [students, setStudents] = useState<Student[]>([])
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [studentEntries, setStudentEntries] = useState<Item[]>([])
  const [totalEntryCount, setTotalEntryCount] = useState(0)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [isEntriesLoading, setIsEntriesLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)

  const combinedError = studentsError || detailError
  const abortStudentsRef = useRef<AbortController | null>(null)
  const abortSummaryRef = useRef<AbortController | null>(null)
  const abortEntriesRef = useRef<AbortController | null>(null)

  const loadStudents = useCallback(async () => {
    if (includeSchoolFilter && !filterSchool) {
      setStudents([])
      setStudentsError(null)
      return
    }

    abortStudentsRef.current?.abort()
    const controller = new AbortController()
    abortStudentsRef.current = controller

    setIsStudentsLoading(true)
    setStudentsError(null)

    try {
      const params = new URLSearchParams()
      if (includeSchoolFilter && filterSchool) {
        params.set('school', filterSchool)
      }
      if (filterGrade) params.set('year', filterGrade)
      if (filterClass) params.set('classNumber', filterClass)
      if (filterName.trim()) params.set('name', filterName.trim())

      const response = await fetch(`${studentsPath}?${params.toString()}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
      const data = await response.json().catch(() => null)

      if (abortStudentsRef.current !== controller || controller.signal.aborted) {
        return
      }

      if (!response.ok) {
        setStudentsError(data?.message ?? studentsLoadErrorMessage)
        setShowErrorModal(true)
        setStudents([])
        return
      }

      setStudents(Array.isArray(data?.students) ? (data.students as Student[]) : [])
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setStudentsError(studentsLoadCatchMessage)
        setShowErrorModal(true)
        setStudents([])
      }
    } finally {
      if (abortStudentsRef.current === controller) {
        abortStudentsRef.current = null
        setIsStudentsLoading(false)
      }
    }
  }, [
    filterClass,
    filterGrade,
    filterName,
    filterSchool,
    includeSchoolFilter,
    studentsLoadCatchMessage,
    studentsLoadErrorMessage,
    studentsPath,
  ])

  const loadStudentSummary = useCallback(async () => {
    if (!selectedStudentId) {
      setSummary(null)
      setDetailError(null)
      return
    }

    abortSummaryRef.current?.abort()
    const controller = new AbortController()
    abortSummaryRef.current = controller

    setIsSummaryLoading(true)
    setDetailError(null)

    try {
      const response = await fetch(summaryPath(selectedStudentId), {
        signal: controller.signal,
        cache: 'no-store',
      })
      const data = await response.json().catch(() => null)

      if (abortSummaryRef.current !== controller || controller.signal.aborted) {
        return
      }

      if (!response.ok) {
        setDetailError(
          (data as { message?: string } | null)?.message ??
            summaryLoadErrorMessage,
        )
        setShowErrorModal(true)
        setSummary(null)
        return
      }

      setSummary((data?.summary ?? null) as Summary | null)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setDetailError(summaryLoadCatchMessage)
        setShowErrorModal(true)
        setSummary(null)
      }
    } finally {
      if (abortSummaryRef.current === controller) {
        abortSummaryRef.current = null
        setIsSummaryLoading(false)
      }
    }
  }, [
    selectedStudentId,
    summaryLoadCatchMessage,
    summaryLoadErrorMessage,
    summaryPath,
  ])

  const loadStudentEntries = useCallback(async () => {
    if (!selectedStudentId) {
      setStudentEntries([])
      setTotalEntryCount(0)
      return
    }

    abortEntriesRef.current?.abort()
    const controller = new AbortController()
    abortEntriesRef.current = controller

    setIsEntriesLoading(true)

    try {
      const params = new URLSearchParams({
        studentId: selectedStudentId,
        page: `${page}`,
        pageSize: `${pageSize}`,
      })

      const response = await fetch(`${entriesPath}?${params.toString()}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
      const data = (await response
        .json()
        .catch(() => initialEntryResponse)) as Response

      if (abortEntriesRef.current !== controller || controller.signal.aborted) {
        return
      }

      if (!response.ok) {
        setDetailError(entriesLoadErrorMessage)
        setShowErrorModal(true)
        setStudentEntries([])
        setTotalEntryCount(0)
        return
      }

      setStudentEntries(Array.isArray(data.items) ? data.items : [])
      setTotalEntryCount(data.totalCount ?? 0)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setDetailError(entriesLoadCatchMessage)
        setShowErrorModal(true)
        setStudentEntries([])
        setTotalEntryCount(0)
      }
    } finally {
      if (abortEntriesRef.current === controller) {
        abortEntriesRef.current = null
        setIsEntriesLoading(false)
      }
    }
  }, [
    entriesLoadCatchMessage,
    entriesLoadErrorMessage,
    entriesPath,
    initialEntryResponse,
    page,
    pageSize,
    selectedStudentId,
  ])

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
    () =>
      students.find((student) => student.studentId === selectedStudentId) ?? null,
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
        onSchoolChange={
          includeSchoolFilter
            ? (value) =>
                updateSearchParams({
                  school: value,
                  year: filterGrade,
                  classNumber: filterClass,
                  name: filterName,
                  studentId: null,
                  page: null,
                  pageSize: null,
                })
            : undefined
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
        showSchoolFilter={includeSchoolFilter}
        title={searchTitle}
        subtitle={searchSubtitle}
        disableReload={includeSchoolFilter ? !filterSchool : false}
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
          <div className="flex-1 min-h-0 p-3">
            {includeSchoolFilter && !filterSchool ? (
              <div className="flex h-full items-center justify-center">
                <ListEmptyState
                  fill
                  icon={<UserFeatureIcon />}
                  iconContained
                  title="학교를 선택하세요"
                  description={studentListLoadTitle}
                />
              </div>
            ) : isStudentsLoading ? (
              <div className="flex h-full min-h-[120px] items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : studentsError ? (
              <div className="flex h-full items-center justify-center">
                <ListEmptyState
                  fill
                  icon={<UserFeatureIcon />}
                  iconContained
                  title={studentListLoadTitle}
                  description={studentsError}
                />
              </div>
            ) : students.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <ListEmptyState
                  fill
                  icon={<UserFeatureIcon />}
                  iconContained
                  title={studentListEmptyTitle}
                  description={studentListEmptyDescription}
                />
              </div>
            ) : (
              <motion.div
                className="space-y-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
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
                              fontFamily:
                                'var(--font-noto-sans-kr), sans-serif',
                              color: 'var(--fg)',
                            }}
                          >
                            {student.name}
                          </p>
                          <p
                            className="text-[11px]"
                            style={{
                              fontFamily:
                                'var(--font-noto-sans-kr), sans-serif',
                              color: 'var(--fg-muted)',
                            }}
                          >
                            {student.grade !== null
                              ? `${student.grade}학년 `
                              : ''}
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
              </motion.div>
            )}
          </div>
        </Card>

        {!selectedStudentId ? (
          <Card className="flex flex-col flex-1 min-h-0">
            <ListEmptyState
              fill
              icon={<UserFeatureIcon />}
              iconContained
              title={summaryEmptyTitle}
              description={summaryEmptyDescription}
            />
          </Card>
        ) : detailError &&
          !summary &&
          studentEntries.length === 0 &&
          !isSummaryLoading &&
          !isEntriesLoading ? (
          <Card className="flex flex-col flex-1 min-h-0">
            <ListEmptyState
              fill
              icon={<UserFeatureIcon />}
              iconContained
              title={detailLoadTitle}
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
