'use client'

import SharedStudentReportTable from './SharedStudentReportTable'
import SharedMileageReportPreview from './SharedMileageReportPreview'
import type { ReportPreviewType } from './ReportPreviewShell'
import type {
  DormClassMileageAnalyticsResponse,
  DormMileageHistoryItem,
  DormStudentMileageSummary,
  PaginatedDormMileageHistoryResponse,
} from './dorm-mileage-types'

export default function DormMileageReportPreview({
  showInitialLoading,
  hasPreviewData,
  previewError,
  showRefetchOverlay,
  reportType,
  reportTitle,
  totalCount,
  pageSize,
  allEntriesCurrentPage,
  allEntriesPageCount,
  filteredStudents,
  classReport,
  allEntriesReport,
  allEntriesPreviewItems,
  startDate,
  endDate,
  onPrint,
  onPageChange,
}: {
  showInitialLoading: boolean
  hasPreviewData: boolean
  previewError: string | null
  showRefetchOverlay: boolean
  reportType: ReportPreviewType
  reportTitle: string
  totalCount: number
  pageSize: number
  allEntriesCurrentPage: number
  allEntriesPageCount: number
  filteredStudents: DormStudentMileageSummary[]
  classReport: DormClassMileageAnalyticsResponse
  allEntriesReport: PaginatedDormMileageHistoryResponse
  allEntriesPreviewItems: DormMileageHistoryItem[]
  startDate: string
  endDate: string
  onPrint: () => void
  onPageChange: (page: number) => void
}) {
  return (
    <SharedMileageReportPreview
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
      onPrint={onPrint}
      onPageChange={onPageChange}
      renderStudentReportTable={(props) => (
        <SharedStudentReportTable<DormStudentMileageSummary, DormMileageHistoryItem>
          {...props}
          entriesApiPath="/api/teacher/dorm-mileage/entries"
          emptyDescription="이 학생에게 아직 기숙사 상벌점 내역이 없습니다."
        />
      )}
    />
  )
}
