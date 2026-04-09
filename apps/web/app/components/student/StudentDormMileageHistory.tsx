'use client'

import SharedStudentMileageHistoryView from './SharedStudentMileageHistoryView'
import type {
  PaginatedStudentDormMileageHistoryResponse,
  StudentDormMileageHistoryItem,
} from './student-dorm-mileage-types'

const INITIAL_RESPONSE: PaginatedStudentDormMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

export default function StudentDormMileageHistory() {
  return (
    <SharedStudentMileageHistoryView<
      StudentDormMileageHistoryItem,
      PaginatedStudentDormMileageHistoryResponse
    >
      entriesPath="/api/student/dorm-mileage/entries"
      initialResponse={INITIAL_RESPONSE}
      loadFailureMessage="기숙사 상벌점 내역을 불러오지 못했습니다."
      loadExceptionMessage="기숙사 상벌점 내역 조회 중 문제가 발생했습니다."
    />
  )
}
