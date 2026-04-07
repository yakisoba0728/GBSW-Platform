'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SuccessModal from '../ui/success-modal'
import { exportToExcel } from '@/lib/export-utils'
import {
  formatAwardedAt,
  formatSignedScore,
} from '../mileage/shared'
import ReportFilters from './ReportFilters'
import DormMileageReportPreview from './DormMileageReportPreview'
import DormStudentSelectionModal from './DormStudentSelectionModal'
import type {
  DormClassMileageAnalyticsResponse,
  DormMileageHistoryItem,
  DormMileageStudentOption,
  DormStudentMileageAnalyticsResponse,
  PaginatedDormMileageHistoryResponse,
} from './dorm-mileage-types'
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

export default function DormMileageReport() {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const reportType = normalizeReportType(
    getQueryString(searchParams, 'reportType'),
  )
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
    useState<DormStudentMileageAnalyticsResponse>({
      students: [],
      totalCount: 0,
    })
  const [classReport, setClassReport] =
    useState<DormClassMileageAnalyticsResponse>({
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
    useState<PaginatedDormMileageHistoryResponse>({
      items: [],
      page: 1,
      pageSize: 100,
      totalCount: 0,
    })
  const [isLoading, setIsLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [showPreviewErrorModal, setShowPreviewErrorModal] = useState(false)

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
    setShowPreviewErrorModal(false)

    try {
      const params = new URLSearchParams()

      if (filterGrade) {
        params.set('year', filterGrade)
      }

      if (startDate) {
        params.set('startDate', startDate)
      }

      if (endDate) {
        params.set('endDate', endDate)
      }

      if (reportType === 'all') {
        const allItems: DormMileageHistoryItem[] = []
        let totalCount = 0
        let totalPages = 1

        for (let currentPage = 1; currentPage <= totalPages; currentPage += 1) {
          if (ctrl.signal.aborted) {
            return
          }

          const pageParams = new URLSearchParams(params)
          pageParams.set('page', `${currentPage}`)
          pageParams.set('pageSize', `${ALL_ENTRIES_FETCH_PAGE_SIZE}`)

          const response = await fetch(
            `/api/teacher/dorm-mileage/entries?${pageParams.toString()}`,
            {
              signal: ctrl.signal,
              cache: 'no-store',
            },
          )
          const result = await response.json().catch(() => null)

          if (abortRef.current !== ctrl || ctrl.signal.aborted) {
            return
          }

          if (!response.ok) {
            setPreviewError(result?.message ?? '데이터를 불러오지 못했습니다.')
            setShowPreviewErrorModal(true)

            if (!hasPreviewData) {
              resetReports()
            }

            return
          }

          const pageItems = Array.isArray(result?.items)
            ? (result.items as DormMileageHistoryItem[])
            : []

          allItems.push(...pageItems)
          totalCount =
            typeof result?.totalCount === 'number' && result.totalCount >= 0
              ? result.totalCount
              : allItems.length
          totalPages = Math.max(
            1,
            Math.ceil(totalCount / ALL_ENTRIES_FETCH_PAGE_SIZE),
          )
        }

        if (abortRef.current !== ctrl || ctrl.signal.aborted) {
          return
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
          ? '/api/teacher/dorm-mileage/analytics/students'
          : '/api/teacher/dorm-mileage/analytics/classes'

      const response = await fetch(`${target}?${params.toString()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      const result = await response.json().catch(() => null)

      if (abortRef.current !== ctrl || ctrl.signal.aborted) {
        return
      }

      if (!response.ok) {
        setPreviewError(result?.message ?? '데이터를 불러오지 못했습니다.')
        setShowPreviewErrorModal(true)

        if (!hasPreviewData) {
          resetReports()
        }

        return
      }

      if (reportType === 'student') {
        setStudentReport({
          students: Array.isArray(result?.students) ? result.students : [],
          totalCount: result?.totalCount ?? 0,
        })
      } else {
        setClassReport({
          classes: Array.isArray(result?.classes) ? result.classes : [],
          overall:
            result?.overall ??
            ({
              classCount: 0,
              totalStudents: 0,
              rewardTotal: 0,
              penaltyTotal: 0,
              netScore: 0,
            } satisfies DormClassMileageAnalyticsResponse['overall']),
        })
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
    endDate,
    filterGrade,
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
    const filename = `기숙사상벌점_${REPORT_TYPE_LABELS[reportType]}_${dateStr}`

    if (reportType === 'student') {
      const exportStudents =
        selectedStudentIds.length > 0
          ? studentReport.students.filter((student) =>
              selectedStudentIds.includes(student.studentId),
            )
          : studentReport.students

      exportToExcel({
        data: exportStudents,
        columns: [
          { header: '학년', accessor: (student) => student.grade ?? '' },
          { header: '반', accessor: (student) => student.classNumber ?? '' },
          { header: '번호', accessor: (student) => student.studentNumber ?? '' },
          { header: '이름', accessor: (student) => student.name },
          { header: '상점 합계', accessor: (student) => student.rewardTotal },
          { header: '벌점 합계', accessor: (student) => student.penaltyTotal },
          { header: '순점수', accessor: (student) => student.netScore },
          { header: '건수', accessor: (student) => student.entryCount },
        ],
        filename,
        sheetName: '학생별',
      })
    } else if (reportType === 'class') {
      exportToExcel({
        data: classReport.classes,
        columns: [
          { header: '학급', accessor: (classSummary) => `${classSummary.classNumber}반` },
          { header: '상점 합계', accessor: (classSummary) => classSummary.rewardTotal },
          { header: '벌점 합계', accessor: (classSummary) => classSummary.penaltyTotal },
          { header: '순점수', accessor: (classSummary) => classSummary.netScore },
        ],
        filename,
        sheetName: '학급별',
      })
    } else {
      exportToExcel({
        data: allEntriesReport.items,
        columns: [
          { header: '부여 일시', accessor: (entry) => formatAwardedAt(entry.awardedAt) },
          { header: '학생', accessor: (entry) => entry.studentName },
          { header: '학년/반/번호', accessor: (entry) => `${entry.grade ?? ''}학년 ${entry.classNumber}반 ${entry.studentNumber}번` },
          { header: '유형', accessor: (entry) => (entry.type === 'reward' ? '상점' : '벌점') },
          { header: '점수', accessor: (entry) => formatSignedScore(entry.type, entry.score) },
          { header: '규정 항목', accessor: (entry) => entry.ruleName },
          { header: '카테고리', accessor: (entry) => entry.ruleCategory },
          { header: '사유', accessor: (entry) => entry.reason ?? '' },
          { header: '부여 교사', accessor: (entry) => entry.teacherName },
        ],
        filename,
        sheetName: '전체내역',
      })
    }
  }, [
    allEntriesReport.items,
    classReport.classes,
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
    (students: DormMileageStudentOption[]) => {
      const newIds = students.map((student) => student.studentId)
      const merged = [...new Set([...selectedStudentIds, ...newIds])]
      handleStudentIdsChange(merged)
      setStudentModalOpen(false)
    },
    [handleStudentIdsChange, selectedStudentIds],
  )

  const reportTitle = useMemo(() => {
    const parts: string[] = ['기숙사']

    if (filterGrade) {
      parts.push(`${filterGrade}학년`)
    }

    if (startDate || endDate) {
      parts.push(`${startDate || '시작'} ~ ${endDate || '현재'}`)
    }

    return [REPORT_TYPE_LABELS[reportType], ...parts].join(' · ')
  }, [endDate, filterGrade, reportType, startDate])

  const filteredStudents = useMemo(() => {
    if (selectedStudentIds.length === 0) {
      return studentReport.students
    }

    const idSet = new Set(selectedStudentIds)

    return studentReport.students.filter((student) => idSet.has(student.studentId))
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
    <div className="flex flex-col h-full gap-4">
      <ReportFilters
        reportType={reportType}
        filterSchool=""
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
        onSchoolChange={() => {}}
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
        showSchoolFilter={false}
      />

      <SuccessModal
        open={showPreviewErrorModal && !!previewError && hasPreviewData}
        onClose={() => setShowPreviewErrorModal(false)}
        type="error"
        title="리포트 조회 실패"
        description={previewError ?? ''}
      />

      <DormMileageReportPreview
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
      />

      <DormStudentSelectionModal
        isOpen={studentModalOpen}
        addedStudentIds={new Set(selectedStudentIds)}
        onClose={() => setStudentModalOpen(false)}
        onConfirm={handleStudentModalConfirm}
      />
    </div>
  )
}
