'use client'

import SharedMileageReportPreview from './SharedMileageReportPreview'
import StudentReportTable from './StudentReportTable'
import type { ReportPreviewType } from './ReportPreviewShell'
import type {
  ClassMileageAnalyticsResponse,
  PaginatedSchoolMileageHistoryResponse,
  StudentMileageAnalyticsResponse,
} from './school-mileage-types'

export default function SchoolMileageReportPreview({
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
  filteredStudents: StudentMileageAnalyticsResponse['students']
  classReport: ClassMileageAnalyticsResponse
  allEntriesReport: PaginatedSchoolMileageHistoryResponse
  allEntriesPreviewItems: PaginatedSchoolMileageHistoryResponse['items']
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
      showPrintOnlyAllEntries
      onPrint={onPrint}
      onPageChange={onPageChange}
      renderStudentReportTable={(props) => <StudentReportTable {...props} />}
    />
  )
}
