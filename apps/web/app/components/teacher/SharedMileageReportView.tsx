'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { exportToExcel, type ExportColumn } from '@/lib/export-utils'
import SuccessModal from '../ui/success-modal'
import ReportFilters from './ReportFilters'
import SharedMileageReportPreview from './SharedMileageReportPreview'
import type {
  SharedClassMileageAnalyticsResponse,
  SharedClassMileageSummary,
  SharedMileageHistoryItem,
  SharedMileageStudentOption,
  SharedPaginatedMileageHistoryResponse,
  SharedStudentMileageSummary,
} from './shared-mileage-types'
import {
  getPositiveQueryNumber,
  getQueryString,
  useUpdateSearchParams,
} from '@/lib/url-state'

type ReportType = 'student' | 'class' | 'all'

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  student: '학생별 보고서',
  class: '학급별 보고서',
  all: '전체 내역',
}

function getSeoulDateStamp() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

function normalizeReportType(value: string): ReportType {
  return value === 'class' || value === 'all' ? value : 'student'
}

type StudentAnalyticsResponse<
  Student extends SharedStudentMileageSummary,
> = {
  students: Student[]
  totalCount: number
}

type SharedMileageReportViewProps<
  Student extends SharedStudentMileageSummary,
  StudentOption extends SharedMileageStudentOption,
  StudentResponse extends StudentAnalyticsResponse<Student>,
  ClassSummary extends SharedClassMileageSummary,
  ClassResponse extends SharedClassMileageAnalyticsResponse<ClassSummary>,
  Item extends SharedMileageHistoryItem,
  HistoryResponse extends SharedPaginatedMileageHistoryResponse<Item>,
> = {
  studentAnalyticsPath: string
  classAnalyticsPath: string
  entriesPath: string
  entriesExportPath?: string
  emptyStudentReport: StudentResponse
  emptyClassReport: ClassResponse
  emptyAllEntriesReport: HistoryResponse
  filenamePrefix: string
  showSchoolFilter?: boolean
  schoolOptions?: Array<{ value: string; label: string }>
  buildReportTitle: (args: {
    reportType: ReportType
    filterSchool: string
    filterGrade: string
    startDate: string
    endDate: string
  }) => string
  exportStudentColumns: ExportColumn<Student>[]
  exportClassColumns: ExportColumn<ClassSummary>[]
  exportAllEntryColumns: ExportColumn<Item>[]
  renderStudentReportTable: (props: {
    students: Student[]
    startDate: string
    endDate: string
  }) => React.ReactNode
  renderStudentSelectionModal: (props: {
    isOpen: boolean
    addedStudentIds: Set<string>
    onClose: () => void
    onConfirm: (students: StudentOption[]) => void
  }) => React.ReactNode
}

export default function SharedMileageReportView<
  Student extends SharedStudentMileageSummary,
  StudentOption extends SharedMileageStudentOption,
  StudentResponse extends StudentAnalyticsResponse<Student>,
  ClassSummary extends SharedClassMileageSummary,
  ClassResponse extends SharedClassMileageAnalyticsResponse<ClassSummary>,
  Item extends SharedMileageHistoryItem,
  HistoryResponse extends SharedPaginatedMileageHistoryResponse<Item>,
>({
  studentAnalyticsPath,
  classAnalyticsPath,
  entriesPath,
  entriesExportPath,
  emptyStudentReport,
  emptyClassReport,
  emptyAllEntriesReport,
  filenamePrefix,
  showSchoolFilter = false,
  schoolOptions,
  buildReportTitle,
  exportStudentColumns,
  exportClassColumns,
  exportAllEntryColumns,
  renderStudentReportTable,
  renderStudentSelectionModal,
}: SharedMileageReportViewProps<
  Student,
  StudentOption,
  StudentResponse,
  ClassSummary,
  ClassResponse,
  Item,
  HistoryResponse
>) {
  const updateSearchParams = useUpdateSearchParams()
  const searchParams = useSearchParams()
  const reportType = normalizeReportType(
    getQueryString(searchParams, 'reportType'),
  )
  const filterSchool = getQueryString(searchParams, 'school')
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
    useState<StudentResponse>(emptyStudentReport)
  const [classReport, setClassReport] = useState<ClassResponse>(emptyClassReport)
  const [allEntriesReport, setAllEntriesReport] =
    useState<HistoryResponse>(emptyAllEntriesReport)
  const [isLoading, setIsLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [showPreviewErrorModal, setShowPreviewErrorModal] = useState(false)

  const hasPreviewData =
    studentReport.students.length > 0 ||
    classReport.classes.length > 0 ||
    allEntriesReport.items.length > 0

  const abortRef = useRef<AbortController | null>(null)

  const resetReports = useCallback(() => {
    setStudentReport(emptyStudentReport)
    setClassReport(emptyClassReport)
    setAllEntriesReport(emptyAllEntriesReport)
  }, [emptyAllEntriesReport, emptyClassReport, emptyStudentReport])

  const loadReport = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsLoading(true)
    setPreviewError(null)
    setShowPreviewErrorModal(false)

    try {
      const params = new URLSearchParams()

      if (showSchoolFilter && filterSchool) {
        params.set('school', filterSchool)
      }

      if (filterGrade) params.set('year', filterGrade)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      if (reportType === 'all') {
        const res = await fetch(
          `${entriesExportPath ?? entriesPath}?${params.toString()}`,
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
          setPreviewError(data?.message ?? '데이터를 불러오지 못했습니다.')
          setShowPreviewErrorModal(true)

          if (!hasPreviewData) {
            resetReports()
          }

          return
        }

        const allItems = Array.isArray(data?.items) ? (data.items as Item[]) : []
        const totalCount =
          typeof data?.totalCount === 'number' && data.totalCount >= 0
            ? data.totalCount
            : allItems.length

        setAllEntriesReport({
          items: allItems,
          page,
          pageSize,
          totalCount,
        } as HistoryResponse)
        return
      }

      const target =
        reportType === 'student' ? studentAnalyticsPath : classAnalyticsPath

      const res = await fetch(`${target}?${params.toString()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)

      if (abortRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if (!res.ok) {
        setPreviewError(data?.message ?? '데이터를 불러오지 못했습니다.')
        setShowPreviewErrorModal(true)

        if (!hasPreviewData) {
          resetReports()
        }

        return
      }

      if (reportType === 'student') {
        setStudentReport({
          students: Array.isArray(data?.students)
            ? (data.students as Student[])
            : [],
          totalCount: data?.totalCount ?? 0,
        } as StudentResponse)
      } else {
        setClassReport({
          classes: Array.isArray(data?.classes)
            ? (data.classes as ClassSummary[])
            : [],
          overall: data?.overall ?? emptyClassReport.overall,
        } as ClassResponse)
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setPreviewError('미리보기 조회 중 문제가 발생했습니다.')
        setShowPreviewErrorModal(true)

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
    classAnalyticsPath,
    emptyClassReport.overall,
    endDate,
    entriesExportPath,
    entriesPath,
    filterGrade,
    filterSchool,
    hasPreviewData,
    page,
    pageSize,
    reportType,
    resetReports,
    showSchoolFilter,
    startDate,
    studentAnalyticsPath,
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

  const handleExport = useCallback(async () => {
    const dateStr = getSeoulDateStamp()
    const filename = `${filenamePrefix}_${REPORT_TYPE_LABELS[reportType]}_${dateStr}`

    if (reportType === 'student') {
      const exportStudents =
        selectedStudentIds.length > 0
          ? studentReport.students.filter((student) =>
              selectedStudentIds.includes(student.studentId),
            )
          : studentReport.students

      await exportToExcel({
        data: exportStudents,
        columns: exportStudentColumns,
        filename,
        sheetName: '학생별',
      })
      return
    }

    if (reportType === 'class') {
      await exportToExcel({
        data: classReport.classes,
        columns: exportClassColumns,
        filename,
        sheetName: '학급별',
      })
      return
    }

    await exportToExcel({
      data: allEntriesReport.items,
      columns: exportAllEntryColumns,
      filename,
      sheetName: '전체내역',
    })
  }, [
    allEntriesReport.items,
    classReport.classes,
    exportAllEntryColumns,
    exportClassColumns,
    exportStudentColumns,
    filenamePrefix,
    reportType,
    selectedStudentIds,
    studentReport.students,
  ])

  const handleStudentIdsChange = useCallback(
    (ids: string[]) => {
      updateSearchParams({ studentIds: ids.length > 0 ? ids.join(',') : null })
    },
    [updateSearchParams],
  )

  const handleStudentModalConfirm = useCallback(
    (students: StudentOption[]) => {
      const newIds = students.map((student) => student.studentId)
      const merged = [...new Set([...selectedStudentIds, ...newIds])]
      handleStudentIdsChange(merged)
      setStudentModalOpen(false)
    },
    [handleStudentIdsChange, selectedStudentIds],
  )

  const reportTitle = useMemo(
    () =>
      buildReportTitle({
        reportType,
        filterSchool,
        filterGrade,
        startDate,
        endDate,
      }),
    [buildReportTitle, endDate, filterGrade, filterSchool, reportType, startDate],
  )

  const filteredStudents = useMemo(() => {
    if (selectedStudentIds.length === 0) {
      return studentReport.students
    }

    const idSet = new Set(selectedStudentIds)
    return studentReport.students.filter((student) =>
      idSet.has(student.studentId),
    )
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

  return (
    <div className="flex h-full flex-col gap-4">
      <ReportFilters
        reportType={reportType}
        filterSchool={showSchoolFilter ? filterSchool : ''}
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
          updateSearchParams({
            school: value,
            page: reportType === 'all' ? 1 : null,
          })
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
        onExport={() => {
          void handleExport()
        }}
        canPrint={!isLoading && hasPreview}
        canExport={!isLoading && hasPreview}
        isLoading={isLoading}
        schoolOptions={schoolOptions}
        showSchoolFilter={showSchoolFilter}
      />

      <SuccessModal
        open={showPreviewErrorModal && !!previewError && hasPreviewData}
        onClose={() => setShowPreviewErrorModal(false)}
        type="error"
        title="리포트 조회 실패"
        description={previewError ?? ''}
      />

      <SharedMileageReportPreview<
        Student,
        ClassResponse,
        Item,
        HistoryResponse
      >
        showInitialLoading={showInitialLoading}
        hasPreviewData={hasPreviewData}
        previewError={previewError}
        showRefetchOverlay={showRefetchOverlay}
        reportType={reportType}
        reportTitle={reportTitle}
        totalCount={totalCount}
        pageSize={pageSize}
        allEntriesCurrentPage={allEntriesCurrentPage}
        allEntriesPageCount={allEntriesPageCount}
        filteredStudents={filteredStudents}
        classReport={classReport}
        allEntriesReport={allEntriesReport}
        allEntriesPreviewItems={allEntriesPreviewItems}
        startDate={startDate}
        endDate={endDate}
        onPrint={handlePrint}
        onPageChange={(nextPage) =>
          updateSearchParams({
            page: nextPage,
            pageSize,
          })
        }
        renderStudentReportTable={renderStudentReportTable}
      />

      {renderStudentSelectionModal({
        isOpen: studentModalOpen,
        addedStudentIds: new Set(selectedStudentIds),
        onClose: () => setStudentModalOpen(false),
        onConfirm: handleStudentModalConfirm,
      })}
    </div>
  )
}
