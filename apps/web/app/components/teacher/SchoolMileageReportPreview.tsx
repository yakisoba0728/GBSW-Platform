'use client'

import { Printer } from 'lucide-react'
import { Card, NoticeBox, SectionTitle } from '@/app/components/mileage/shared'
import { Button } from '../ui/button'
import { EmptyStatePane, ListSkeleton } from '../ui/list'
import { FileIcon } from '../ui/icons'
import { RefetchWrapper } from '../ui/primitives'
import type {
  ClassMileageAnalyticsResponse,
  PaginatedSchoolMileageHistoryResponse,
  StudentMileageAnalyticsResponse,
} from './school-mileage-types'
import AllEntriesReportTable from './AllEntriesReportTable'
import ClassReportTable from './ClassReportTable'
import StudentReportTable from './StudentReportTable'

type ReportType = 'student' | 'class' | 'all'

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
  reportType: ReportType
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
  const hasPreview =
    reportType === 'student'
      ? filteredStudents.length > 0
      : reportType === 'class'
        ? classReport.classes.length > 0
        : allEntriesReport.items.length > 0

  return (
    <>
      {previewError && hasPreviewData && (
        <NoticeBox type="error" message={previewError} />
      )}

      <div className="print-area flex min-h-0 flex-1 flex-col">
        {showInitialLoading ? (
          <Card className="min-h-[320px]">
            <ListSkeleton count={5} rowHeight="h-12" />
          </Card>
        ) : !hasPreviewData && previewError ? (
          <Card className="flex min-h-0 flex-1 flex-col">
            <EmptyStatePane
              icon={<FileIcon style={{ color: 'var(--admin-accent)' }} />}
              title="미리보기를 불러오지 못했습니다"
              description={previewError}
              className="min-h-[320px]"
            />
          </Card>
        ) : !hasPreviewData ? (
          <Card className="flex min-h-0 flex-1 flex-col">
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
            className="flex min-h-0 flex-1 flex-col"
          >
            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <div
                className="flex flex-shrink-0 items-start justify-between px-5 py-4"
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
                <Button
                  className="no-print"
                  variant="ghost"
                  size="sm"
                  icon={<Printer size={12} aria-hidden="true" />}
                  onClick={onPrint}
                >
                  인쇄
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                {reportType === 'student' &&
                  (hasPreview ? (
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
                  ))}

                {reportType === 'class' &&
                  (hasPreview ? (
                    <ClassReportTable classes={classReport.classes} />
                  ) : (
                    <EmptyStatePane
                      icon={<FileIcon style={{ color: 'var(--admin-accent)' }} />}
                      title="조회 결과가 없습니다"
                      description="다른 조건으로 다시 조회해 보세요."
                      className="min-h-full"
                    />
                  ))}

                {reportType === 'all' &&
                  (hasPreview ? (
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
                  ))}
              </div>

              {reportType === 'all' && allEntriesReport.totalCount > pageSize && (
                <div className="no-print flex flex-shrink-0 items-center justify-end gap-2 px-5 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, allEntriesCurrentPage - 1))}
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
                      onPageChange(
                        Math.min(allEntriesPageCount, allEntriesCurrentPage + 1),
                      )
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
    </>
  )
}
