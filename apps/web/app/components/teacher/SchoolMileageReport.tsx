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
import { ListEmptyState, LoadingSpinner } from '../ui/list'
import { FileIcon } from '../ui/icons'
import { exportToExcel } from '@/lib/export-utils'
import type {
  ClassMileageAnalyticsResponse,
  PaginatedSchoolMileageHistoryResponse,
  SchoolCode,
  SchoolMileageHistoryItem,
  StudentMileageAnalyticsResponse,
} from './school-mileage-types'
import AllEntriesReportTable from './AllEntriesReportTable'
import ClassReportTable from './ClassReportTable'
import ReportFilters from './ReportFilters'
import StudentReportTable from './StudentReportTable'
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
            resetReports()
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
        resetReports()
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
        resetReports()
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
      exportToExcel({
        data: studentReport.students,
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
  }, [allEntriesReport.items, classReport.classes, reportType, studentReport.students])

  const reportTitle = useMemo(() => {
    const parts: string[] = []
    if (filterSchool) parts.push(getSchoolLabel(filterSchool))
    if (filterGrade) parts.push(`${filterGrade}학년`)
    if (startDate || endDate) parts.push(`${startDate || '시작'} ~ ${endDate || '현재'}`)
    return [REPORT_TYPE_LABELS[reportType], ...parts].join(' · ')
  }, [endDate, filterGrade, filterSchool, reportType, startDate])

  const hasPreview =
    reportType === 'student'
      ? studentReport.students.length > 0
      : reportType === 'class'
        ? classReport.classes.length > 0
        : allEntriesReport.items.length > 0

  const totalCount =
    reportType === 'student'
      ? studentReport.totalCount
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

  return (
    <div className="flex flex-col h-full gap-4">
      <ReportFilters
        reportType={reportType}
        filterSchool={filterSchool}
        filterGrade={filterGrade}
        startDate={startDate}
        endDate={endDate}
        onReportTypeChange={(value) =>
          updateSearchParams({
            reportType: value,
            page: value === 'all' ? 1 : null,
            pageSize: value === 'all' ? 100 : null,
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

      {previewError && <NoticeBox type="error" message={previewError} />}

      <div className="print-area flex flex-col flex-1 min-h-0">
        {isLoading && (
          <Card>
            <LoadingSpinner />
          </Card>
        )}

        {!isLoading && !hasPreview && !previewError && (
          <Card>
            <ListEmptyState
              icon={<FileIcon style={{ color: 'var(--admin-accent)' }} />}
              title="데이터가 없습니다"
              description="다른 조건으로 다시 조회해 보세요."
            />
          </Card>
        )}

        {!isLoading && hasPreview && (
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
              <button
                type="button"
                onClick={handlePrint}
                className="no-print flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-opacity hover:opacity-70"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  borderColor: 'var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                }}
              >
                <Printer size={12} aria-hidden="true" />
                인쇄
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
              {reportType === 'student' && (
                <StudentReportTable students={studentReport.students} />
              )}
              {reportType === 'class' && (
                <ClassReportTable classes={classReport.classes} />
              )}
              {reportType === 'all' && (
                <>
                  <div className="no-print">
                    <AllEntriesReportTable entries={allEntriesPreviewItems} />
                  </div>
                  <div className="print-only">
                    <AllEntriesReportTable entries={allEntriesReport.items} />
                  </div>
                </>
              )}
            </div>

            {reportType === 'all' && allEntriesReport.totalCount > pageSize && (
              <div className="no-print flex flex-shrink-0 items-center justify-end gap-2 px-5 py-4">
                <button
                  type="button"
                  onClick={() =>
                    updateSearchParams({
                      page: Math.max(1, allEntriesCurrentPage - 1),
                      pageSize,
                    })
                  }
                  disabled={allEntriesCurrentPage <= 1}
                  className="rounded-md border px-2.5 py-1.5 text-xs transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  이전
                </button>
                <span
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  {allEntriesCurrentPage} / {allEntriesPageCount}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateSearchParams({
                      page: Math.min(allEntriesPageCount, allEntriesCurrentPage + 1),
                      pageSize,
                    })
                  }
                  disabled={allEntriesCurrentPage >= allEntriesPageCount}
                  className="rounded-md border px-2.5 py-1.5 text-xs transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  다음
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
