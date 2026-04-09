'use client'

import AllEntriesReportTable from './AllEntriesReportTable'
import ClassReportTable from './ClassReportTable'
import ReportPreviewShell from './ReportPreviewShell'
import type { ReportPreviewType } from './ReportPreviewShell'
import type {
  SharedClassMileageAnalyticsResponse,
  SharedMileageHistoryItem,
  SharedPaginatedMileageHistoryResponse,
  SharedStudentMileageSummary,
} from './shared-mileage-types'

type SharedMileageReportPreviewProps<
  Student extends SharedStudentMileageSummary,
  ClassResponse extends SharedClassMileageAnalyticsResponse,
  Item extends SharedMileageHistoryItem,
  Response extends SharedPaginatedMileageHistoryResponse<Item>,
> = {
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
  filteredStudents: Student[]
  classReport: ClassResponse
  allEntriesReport: Response
  allEntriesPreviewItems: Item[]
  startDate: string
  endDate: string
  showPrintOnlyAllEntries?: boolean
  onPrint: () => void
  onPageChange: (page: number) => void
  renderStudentReportTable: (props: {
    students: Student[]
    startDate: string
    endDate: string
  }) => React.ReactNode
}

export default function SharedMileageReportPreview<
  Student extends SharedStudentMileageSummary,
  ClassResponse extends SharedClassMileageAnalyticsResponse,
  Item extends SharedMileageHistoryItem,
  Response extends SharedPaginatedMileageHistoryResponse<Item>,
>({
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
  showPrintOnlyAllEntries = false,
  onPrint,
  onPageChange,
  renderStudentReportTable,
}: SharedMileageReportPreviewProps<Student, ClassResponse, Item, Response>) {
  const hasPreview =
    reportType === 'student'
      ? filteredStudents.length > 0
      : reportType === 'class'
        ? classReport.classes.length > 0
        : allEntriesReport.items.length > 0

  return (
    <ReportPreviewShell
      showInitialLoading={showInitialLoading}
      hasPreviewData={hasPreviewData}
      previewError={previewError}
      showRefetchOverlay={showRefetchOverlay}
      reportType={reportType}
      reportTitle={reportTitle}
      totalCount={totalCount}
      pageSize={pageSize}
      currentPage={allEntriesCurrentPage}
      pageCount={allEntriesPageCount}
      hasPreview={hasPreview}
      onPrint={onPrint}
      onPageChange={onPageChange}
    >
      {reportType === 'student' &&
        renderStudentReportTable({
          students: filteredStudents,
          startDate,
          endDate,
        })}

      {reportType === 'class' && (
        <ClassReportTable classes={classReport.classes} />
      )}

      {reportType === 'all' &&
        (showPrintOnlyAllEntries ? (
          <>
            <div className="no-print">
              <AllEntriesReportTable entries={allEntriesPreviewItems} />
            </div>
            <div className="print-only">
              <AllEntriesReportTable entries={allEntriesReport.items} />
            </div>
          </>
        ) : (
          <AllEntriesReportTable entries={allEntriesPreviewItems} />
        ))}
    </ReportPreviewShell>
  )
}
