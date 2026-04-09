'use client'

import EditEntryModal from './EditEntryModal'
import HistoryFilters from './HistoryFilters'
import SharedMileageHistoryView from './SharedMileageHistoryView'
import type {
  PaginatedSchoolMileageHistoryResponse,
  SchoolMileageHistoryItem,
} from './school-mileage-types'

const INITIAL_RESPONSE: PaginatedSchoolMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

export default function SchoolMileageHistory({
  rulesError,
}: {
  rulesError: string | null
}) {
  return (
    <SharedMileageHistoryView<
      SchoolMileageHistoryItem,
      PaginatedSchoolMileageHistoryResponse
    >
      rulesError={rulesError}
      initialResponse={INITIAL_RESPONSE}
      entriesPath="/api/teacher/school-mileage/entries"
      includeSchoolFilter
      loadErrorMessage="상벌점 내역을 불러오지 못했습니다."
      loadCatchMessage="상벌점 내역 조회 중 문제가 발생했습니다."
      deleteErrorMessage="상벌점 내역을 삭제하지 못했습니다."
      deleteCatchMessage="상벌점 내역 삭제 중 문제가 발생했습니다."
      deleteSuccessMessage="상벌점 내역이 삭제되었습니다."
      deleteConfirmMessage={(item) =>
        `${item.studentName} 학생의 "${item.ruleName}" 내역을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`
      }
      renderEditModal={(props) => (
        <EditEntryModal {...props} isOpen={props.item !== null} />
      )}
      renderFilters={({ filters, hasActiveFilters, onChange, onReset }) => (
        <HistoryFilters
          filters={{
            school: filters.school ?? '',
            type: filters.type,
            year: filters.year,
            startDate: filters.startDate,
            endDate: filters.endDate,
            studentName: filters.studentName,
          }}
          hasActiveFilters={hasActiveFilters}
          onChange={onChange}
          onReset={onReset}
        />
      )}
    />
  )
}
