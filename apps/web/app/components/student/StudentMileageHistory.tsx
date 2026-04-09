'use client'

import SharedStudentMileageHistoryView from './SharedStudentMileageHistoryView'
import type {
  PaginatedSchoolMileageHistoryResponse,
  SchoolMileageHistoryItem,
} from './student-mileage-types'

const INITIAL_RESPONSE: PaginatedSchoolMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

export default function StudentMileageHistory() {
  return (
    <SharedStudentMileageHistoryView<
      SchoolMileageHistoryItem,
      PaginatedSchoolMileageHistoryResponse
    >
      entriesPath="/api/student/school-mileage/entries"
      initialResponse={INITIAL_RESPONSE}
      loadFailureMessage="상벌점 내역을 불러오지 못했습니다."
      loadExceptionMessage="상벌점 내역 조회 중 문제가 발생했습니다."
    />
  )
}
