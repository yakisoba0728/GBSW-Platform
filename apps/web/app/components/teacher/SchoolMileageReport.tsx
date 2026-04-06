'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Printer } from 'lucide-react'
import {
  Card,
  NoticeBox,
  SCHOOL_OPTIONS,
  SectionTitle,
  formatAwardedAt,
  formatSignedScore,
  getSchoolLabel,
} from './teacher-shared'
import { Button } from '../ui/button'
import { EmptyStatePane, ListSkeleton } from '../ui/list'
import { FileIcon } from '../ui/icons'
import { RefetchWrapper } from '../ui/primitives'
import { exportToExcel } from '@/lib/export-utils'
import type {
  ClassMileageAnalyticsResponse,
  PaginatedSchoolMileageHistoryResponse,
  SchoolCode,
  SchoolMileageHistoryItem,
  SchoolMileageStudentOption,
  StudentMileageAnalyticsResponse,
} from './school-mileage-types'
import AllEntriesReportTable from './AllEntriesReportTable'
import ClassReportTable from './ClassReportTable'
import ReportFilters from './ReportFilters'
import StudentReportTable from './StudentReportTable'
import StudentSelectionModal from './StudentSelectionModal'
import {
  getPositiveQueryNumber,
  getQueryString,
  useUpdateSearchParams,
} from '@/lib/url-state'

type ReportType = 'student' | 'class' | 'all'
const ALL_ENTRIES_FETCH_PAGE_SIZE = 100

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  student: '학생별 보고서',
  class: '학급별 보고서',
  all: '전체 내역',
}

function normalizeReportType(value: string): ReportType {
  return value === 'class' || value === 'all' ? value : 'student'
}

export default function SchoolMileageReport() {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const reportType = normalizeReportType(
    getQueryString(searchParams, 'reportType'),
  )
  const filterSchool = getQueryString(searchParams, 'school') as SchoolCode | ''
  const filterGrade = getQueryString(searchParams, 'year')
  const startDate = getQueryString(searchParams, 'startDate')
  const endDate = getQueryString(searchParams, 'endDate')
  const page = getPositiveQueryNumber(searchParams, 'page', 1)
  const pageSize = getPositiveQueryNumber(searchParams, 'pageSize', 100)
  const studentIdsParam = getQueryString(searchParams, 'studentIds')
  const selectedStudentIds = useMemo(
    () => (studentIdsParam ? studentIdsParam.split(',').filter(Boolean) : []),
    [studentIdsParam],
  )

  const [studentModalOpen, setStudentModalOpen] = useState(false)

  const [studentReport, setStudentReport] =
    useState<StudentMileageAnalyticsResponse>({
      students: [],
      totalCount: 0,
    })
  const [classReport, setClassReport] = useState<ClassMileageAnalyticsResponse>({
    classes: [],
    overall: {
      classCount: 0,
      totalStudents: 0,
      rewardTotal: 0,
      penaltyTotal: 0,
      netScore: 0,
    },
  })
  const [allEntriesReport, setAllEntriesReport] =
    useState<PaginatedSchoolMileageHistoryResponse>({
      items: [],
      page: 1,
      pageSize: 100,
      totalCount: 0,
    })
  const [isLoading, setIsLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const hasPreviewData =
    studentReport.students.length > 0 ||
    classReport.classes.length > 0 ||
    allEntriesReport.items.length > 0

  const abortRef = useRef<AbortController | null>(null)

  const resetReports = useCallback(() => {
    setStudentReport({ students: [], totalCount: 0 })
    setClassReport({
      classes: [],
      overall: {
        classCount: 0,
        totalStudents: 0,
        rewardTotal: 0,
        penaltyTotal: 0,
        netScore: 0,
      },
    })
    setAllEntriesReport({
      items: [],
      page: 1,
      pageSize: 100,
      totalCount: 0,
    })
  }, [])

  const loadReport = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsLoading(true)
    setPreviewError(null)

    try {
      const params = new URLSearchParams()
      if (filterSchool) params.set('school', filterSchool)
      if (filterGrade) params.set('year', filterGrade)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      if (reportType === 'all') {
        const allItems: SchoolMileageHistoryItem[] = []
        let totalCount = 0
        let totalPages = 1

        for (let currentPage = 1; currentPage <= totalPages; currentPage += 1) {
          if (ctrl.signal.aborted) {
            return
          }

          const pageParams = new URLSearchParams(params)
          pageParams.set('page', `${currentPage}`)
          pageParams.set('pageSize', `${ALL_ENTRIES_FETCH_PAGE_SIZE}`)

          const res = await fetch(
            `/api/teacher/school-mileage/entries?${pageParams.toString()}`,
            {
              signal: ctrl.signal,
              cache: 'no-store',
            },
          )
          const data = await res.json().catch(() => null)

          if (!res.ok) {
            setPreviewError(data?.message ?? '데이터를 불러오지 못했습니다.')
            if (!hasPreviewData) {
              resetReports()
            }
            return
          }

          const pageItems = Array.isArray(data?.items)
            ? (data.items as SchoolMileageHistoryItem[])
            : []

          allItems.push(...pageItems)
          totalCount =
            typeof data?.totalCount === 'number' && data.totalCount >= 0
              ? data.totalCount
              : allItems.length
          totalPages = Math.max(
            1,
            Math.ceil(totalCount / ALL_ENTRIES_FETCH_PAGE_SIZE),
          )
        }

        setAllEntriesReport({
          items: allItems,
          page,
          pageSize,
          totalCount,
        })
        return
      }

      const target =
        reportType === 'student'
          ? '/api/teacher/school-mileage/analytics/students'
          : '/api/teacher/school-mileage/analytics/classes'

      const res = await fetch(`${target}?${params.toString()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setPreviewError(data?.message ?? '데이터를 불러오지 못했습니다.')
        if (!hasPreviewData) {
          resetReports()
        }
        return
      }

      if (reportType === 'student') {
        setStudentReport({
          students: Array.isArray(data?.students) ? data.students : [],
          totalCount: data?.totalCount ?? 0,
        })
      } else if (reportType === 'class') {
        setClassReport({
          classes: Array.isArray(data?.classes) ? data.classes : [],
          overall:
            data?.overall ??
            ({
              classCount: 0,
              totalStudents: 0,
              rewardTotal: 0,
              penaltyTotal: 0,
              netScore: 0,
            } satisfies ClassMileageAnalyticsResponse['overall']),
        })
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setPreviewError('미리보기 조회 중 문제가 발생했습니다.')
        if (!hasPreviewData) {
          resetReports()
        }
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null
        setIsLoading(false)
      }
    }
  }, [
    endDate,
    filterGrade,
    filterSchool,
    hasPreviewData,
    page,
    pageSize,
    reportType,
    resetReports,
    startDate,
  ])

  useEffect(() => {
    void loadReport()

    return () => {
      abortRef.current?.abort()
    }
  }, [loadReport])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleExport = useCallback(() => {
    const now = new Date()
    const dateStr = [
      now.getFullYear(),
      `${now.getMonth() + 1}`.padStart(2, '0'),
      `${now.getDate()}`.padStart(2, '0'),
    ].join('-')
    const filename = `상벌점_${REPORT_TYPE_LABELS[reportType]}_${dateStr}`

    if (reportType === 'student') {
      const exportStudents =
        selectedStudentIds.length > 0
          ? studentReport.students.filter((s) =>
              selectedStudentIds.includes(s.studentId),
            )
          : studentReport.students
      exportToExcel({
        data: exportStudents,
        columns: [
          { header: '학교', accessor: (s) => getSchoolLabel(s.school) },
          { header: '학년', accessor: (s) => s.grade ?? '' },
          { header: '반', accessor: (s) => s.classNumber ?? '' },
          { header: '번호', accessor: (s) => s.studentNumber ?? '' },
          { header: '이름', accessor: (s) => s.name },
          { header: '상점 합계', accessor: (s) => s.rewardTotal },
          { header: '벌점 합계', accessor: (s) => s.penaltyTotal },
          { header: '순점수', accessor: (s) => s.netScore },
          { header: '건수', accessor: (s) => s.entryCount },
        ],
        filename,
        sheetName: '학생별',
      })
    } else if (reportType === 'class') {
      exportToExcel({
        data: classReport.classes,
        columns: [
          { header: '학급', accessor: (c) => `${c.classNumber}반` },
          { header: '상점 합계', accessor: (c) => c.rewardTotal },
          { header: '벌점 합계', accessor: (c) => c.penaltyTotal },
          { header: '순점수', accessor: (c) => c.netScore },
        ],
        filename,
        sheetName: '학급별',
      })
    } else {
      exportToExcel({
        data: allEntriesReport.items,
        columns: [
          { header: '부여 일시', accessor: (e) => formatAwardedAt(e.awardedAt) },
          { header: '학생', accessor: (e) => e.studentName },
          { header: '학년/반/번호', accessor: (e) => `${e.grade ?? ''}학년 ${e.classNumber}반 ${e.studentNumber}번` },
          { header: '유형', accessor: (e) => (e.type === 'reward' ? '상점' : '벌점') },
          { header: '점수', accessor: (e) => formatSignedScore(e.type, e.score) },
          { header: '규정 항목', accessor: (e) => e.ruleName },
          { header: '카테고리', accessor: (e) => e.ruleCategory },
          { header: '사유', accessor: (e) => e.reason ?? '' },
          { header: '부여 교사', accessor: (e) => e.teacherName },
        ],
        filename,
        sheetName: '전체내역',
      })
    }
  }, [allEntriesReport.items, classReport.classes, reportType, selectedStudentIds, studentReport.students])

  const handleStudentIdsChange = useCallback(
    (ids: string[]) => {
      updateSearchParams({ studentIds: ids.length > 0 ? ids.join(',') : null })
    },
    [updateSearchParams],
  )

  const handleStudentModalConfirm = useCallback(
    (students: SchoolMileageStudentOption[]) => {
      const newIds = students.map((s) => s.studentId)
      const merged = [...new Set([...selectedStudentIds, ...newIds])]
      handleStudentIdsChange(merged)
      setStudentModalOpen(false)
    },
    [handleStudentIdsChange, selectedStudentIds],
  )

  const reportTitle = useMemo(() => {
    const parts: string[] = []
    if (filterSchool) parts.push(getSchoolLabel(filterSchool))
    if (filterGrade) parts.push(`${filterGrade}학년`)
    if (startDate || endDate) parts.push(`${startDate || '시작'} ~ ${endDate || '현재'}`)
    return [REPORT_TYPE_LABELS[reportType], ...parts].join(' · ')
  }, [endDate, filterGrade, filterSchool, reportType, startDate])

  const filteredStudents = useMemo(() => {
    if (selectedStudentIds.length === 0) return studentReport.students
    const idSet = new Set(selectedStudentIds)
    return studentReport.students.filter((s) => idSet.has(s.studentId))
  }, [selectedStudentIds, studentReport.students])

  const hasPreview =
    reportType === 'student'
      ? filteredStudents.length > 0
      : reportType === 'class'
        ? classReport.classes.length > 0
        : allEntriesReport.items.length > 0

  const totalCount =
    reportType === 'student'
      ? filteredStudents.length
      : reportType === 'class'
        ? classReport.classes.length
        : allEntriesReport.totalCount

  const allEntriesPageCount = Math.max(
    1,
    Math.ceil(allEntriesReport.totalCount / pageSize),
  )
  const allEntriesCurrentPage = Math.min(page, allEntriesPageCount)
  const allEntriesPreviewItems = useMemo(() => {
    const startIndex = (allEntriesCurrentPage - 1) * pageSize

    return allEntriesReport.items.slice(startIndex, startIndex + pageSize)
  }, [allEntriesCurrentPage, allEntriesReport.items, pageSize])

  const showInitialLoading = isLoading && !hasPreviewData
  const showRefetchOverlay = isLoading && hasPreviewData
  const showErrorBanner = !!previewError && hasPreviewData

  return (
    <div className="flex flex-col h-full gap-4">
      <ReportFilters
        reportType={reportType}
        filterSchool={filterSchool}
        filterGrade={filterGrade}
        startDate={startDate}
        endDate={endDate}
        selectedStudentIds={selectedStudentIds}
        onReportTypeChange={(value) =>
          updateSearchParams({
            reportType: value,
            page: value === 'all' ? 1 : null,
            pageSize: value === 'all' ? 100 : null,
            studentIds: null,
          })
        }
        onSchoolChange={(value) =>
          updateSearchParams({ school: value, page: reportType === 'all' ? 1 : null })
        }
        onGradeChange={(value) =>
          updateSearchParams({ year: value, page: reportType === 'all' ? 1 : null })
        }
        onStartDateChange={(value) =>
          updateSearchParams({
            startDate: value,
            page: reportType === 'all' ? 1 : null,
          })
        }
        onEndDateChange={(value) =>
          updateSearchParams({
            endDate: value,
            page: reportType === 'all' ? 1 : null,
          })
        }
        onStudentIdsChange={handleStudentIdsChange}
        onOpenStudentModal={() => setStudentModalOpen(true)}
        onReload={() => {
          void loadReport()
        }}
        onPrint={handlePrint}
        onExport={handleExport}
        canPrint={!isLoading && hasPreview}
        canExport={!isLoading && hasPreview}
        isLoading={isLoading}
        schoolOptions={SCHOOL_OPTIONS}
      />

      {showErrorBanner && <NoticeBox type="error" message={previewError} />}

      <div className="print-area flex flex-col flex-1 min-h-0">
        {showInitialLoading ? (
          <Card className="min-h-[320px]">
            <ListSkeleton count={5} rowHeight="h-12" />
          </Card>
        ) : !hasPreviewData && previewError ? (
          <Card className="flex flex-1 min-h-0 flex-col">
            <EmptyStatePane
              icon={<FileIcon style={{ color: 'var(--admin-accent)' }} />}
              title="미리보기를 불러오지 못했습니다"
              description={previewError}
              className="min-h-[320px]"
            />
          </Card>
        ) : !hasPreviewData ? (
          <Card className="flex flex-1 min-h-0 flex-col">
            <EmptyStatePane
              icon={<FileIcon style={{ color: 'var(--admin-accent)' }} />}
              title="데이터가 없습니다"
              description="다른 조건으로 다시 조회해 보세요."
              className="min-h-[320px]"
            />
          </Card>
        ) : (
          <RefetchWrapper
            isFetching={showRefetchOverlay}
            isInitialLoad={false}
            className="flex flex-col flex-1 min-h-0"
          >
            <Card className="overflow-hidden p-0 flex flex-col flex-1 min-h-0">
              <div
                className="flex-shrink-0 flex items-start justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--admin-border)' }}
              >
                <div>
                  <SectionTitle>{reportTitle}</SectionTitle>
                  <p
                    className="text-xs"
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      color: 'var(--admin-text-muted)',
                    }}
                  >
                    총 {totalCount}건
                    {reportType === 'all' && allEntriesReport.totalCount > pageSize && (
                      <span className="ml-2">
                        (페이지 {allEntriesCurrentPage} / {allEntriesPageCount})
                      </span>
                    )}
                  </p>
                </div>
                <Button className="no-print" variant="ghost" size="sm" icon={<Printer size={12} aria-hidden="true" />} onClick={handlePrint}>인쇄</Button>
              </div>

              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                {reportType === 'student' && (
                  hasPreview ? (
                    <StudentReportTable
                      students={filteredStudents}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  ) : (
                    <EmptyStatePane
                      icon={<FileIcon style={{ color: 'var(--admin-accent)' }} />}
                      title="조회 결과가 없습니다"
                      description="선택한 학생 조건을 다시 확인해 보세요."
                      className="min-h-full"
                    />
                  )
                )}
                {reportType === 'class' && (
                  hasPreview ? (
                    <ClassReportTable classes={classReport.classes} />
                  ) : (
                    <EmptyStatePane
                      icon={<FileIcon style={{ color: 'var(--admin-accent)' }} />}
                      title="조회 결과가 없습니다"
                      description="다른 조건으로 다시 조회해 보세요."
                      className="min-h-full"
                    />
                  )
                )}
                {reportType === 'all' && (
                  hasPreview ? (
                    <>
                      <div className="no-print">
                        <AllEntriesReportTable entries={allEntriesPreviewItems} />
                      </div>
                      <div className="print-only">
                        <AllEntriesReportTable entries={allEntriesReport.items} />
                      </div>
                    </>
                  ) : (
                    <EmptyStatePane
                      icon={<FileIcon style={{ color: 'var(--admin-accent)' }} />}
                      title="조회 결과가 없습니다"
                      description="다른 조건으로 다시 조회해 보세요."
                      className="min-h-full"
                    />
                  )
                )}
              </div>

              {reportType === 'all' && allEntriesReport.totalCount > pageSize && (
                <div className="no-print flex flex-shrink-0 items-center justify-end gap-2 px-5 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateSearchParams({
                        page: Math.max(1, allEntriesCurrentPage - 1),
                        pageSize,
                      })
                    }
                    disabled={allEntriesCurrentPage <= 1}
                  >
                    이전
                  </Button>
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      color: 'var(--admin-text-muted)',
                    }}
                  >
                    {allEntriesCurrentPage} / {allEntriesPageCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateSearchParams({
                        page: Math.min(allEntriesPageCount, allEntriesCurrentPage + 1),
                        pageSize,
                      })
                    }
                    disabled={allEntriesCurrentPage >= allEntriesPageCount}
                  >
                    다음
                  </Button>
                </div>
              )}
            </Card>
          </RefetchWrapper>
        )}
      </div>

      <StudentSelectionModal
        isOpen={studentModalOpen}
        addedStudentIds={new Set(selectedStudentIds)}
        onClose={() => setStudentModalOpen(false)}
        onConfirm={handleStudentModalConfirm}
      />
    </div>
  )
}
