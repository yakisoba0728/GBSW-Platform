'use client'

import SharedEditEntryModal from './SharedEditEntryModal'
import SharedHistoryFilters from './SharedHistoryFilters'
import SharedMileageHistoryView from './SharedMileageHistoryView'
import { useDormRulesContext } from '../mileage/rules-context'
import type {
  DormMileageHistoryItem,
  PaginatedDormMileageHistoryResponse,
} from './dorm-mileage-types'

const INITIAL_RESPONSE: PaginatedDormMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

export default function DormMileageHistory({
  rulesError,
}: {
  rulesError: string | null
}) {
  const { isDormTeacher } = useDormRulesContext()

  return (
    <SharedMileageHistoryView<
      DormMileageHistoryItem,
      PaginatedDormMileageHistoryResponse
    >
      rulesError={rulesError}
      initialResponse={INITIAL_RESPONSE}
      entriesPath="/api/teacher/dorm-mileage/entries"
      canManageEntries={isDormTeacher === true}
      loadErrorMessage="기숙사 상벌점 내역을 불러오지 못했습니다."
      loadCatchMessage="기숙사 상벌점 내역 조회 중 문제가 발생했습니다."
      deleteErrorMessage="기숙사 상벌점 내역을 삭제하지 못했습니다."
      deleteCatchMessage="기숙사 상벌점 내역 삭제 중 문제가 발생했습니다."
      deleteSuccessMessage="기숙사 상벌점 내역이 삭제되었습니다."
      deleteConfirmMessage={(item) =>
        `${item.studentName ?? '이름 없음'} 학생의 "${item.ruleName}" 내역을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`
      }
      renderEditModal={(props) => (
        <SharedEditEntryModal<DormMileageHistoryItem>
          {...props}
          isOpen={props.item !== null}
          apiPath="/api/teacher/dorm-mileage/entries"
          title="기숙사 상벌점 내역 편집"
          saveErrorMessage="기숙사 상벌점 내역을 수정하지 못했습니다."
          saveSuccessMessage="기숙사 상벌점 내역이 수정되었습니다."
          submitErrorMessage="기숙사 상벌점 내역 수정 중 문제가 발생했습니다."
        />
      )}
      renderFilters={({ filters, hasActiveFilters, onChange, onReset }) => (
        <SharedHistoryFilters
          filters={{
            type: filters.type,
            year: filters.year,
            startDate: filters.startDate,
            endDate: filters.endDate,
            studentName: filters.studentName,
          }}
          hasActiveFilters={hasActiveFilters}
          onTypeChange={(value) => onChange('type', value)}
          onYearChange={(value) => onChange('year', value)}
          onStartDateChange={(value) => onChange('startDate', value)}
          onEndDateChange={(value) => onChange('endDate', value)}
          onStudentNameChange={(value) => onChange('studentName', value)}
          onReset={onReset}
        />
      )}
    />
  )
}
