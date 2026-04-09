'use client'

import SharedMileageStudentView from './SharedMileageStudentView'
import type {
  PaginatedSchoolMileageHistoryResponse,
  SchoolMileageHistoryItem,
  SchoolMileageStudentOption,
  StudentMileageSummary,
} from './school-mileage-types'

const EMPTY_ENTRY_RESPONSE: PaginatedSchoolMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

export default function SchoolMileageStudentView() {
  return (
    <SharedMileageStudentView<
      SchoolMileageStudentOption,
      StudentMileageSummary,
      SchoolMileageHistoryItem,
      PaginatedSchoolMileageHistoryResponse
    >
      includeSchoolFilter
      studentsPath="/api/teacher/school-mileage/students"
      summaryPath={(studentId) =>
        `/api/teacher/school-mileage/students/${encodeURIComponent(studentId)}/summary`
      }
      entriesPath="/api/teacher/school-mileage/entries"
      studentsLoadErrorMessage="학생 목록을 불러오지 못했습니다."
      studentsLoadCatchMessage="학생 목록 조회 중 문제가 발생했습니다."
      summaryLoadErrorMessage="학생 요약을 불러오지 못했습니다."
      summaryLoadCatchMessage="학생 요약 조회 중 문제가 발생했습니다."
      entriesLoadErrorMessage="학생 처리 내역을 불러오지 못했습니다."
      entriesLoadCatchMessage="학생 처리 내역 조회 중 문제가 발생했습니다."
      studentListEmptyTitle="학생이 없습니다"
      studentListEmptyDescription="검색 조건을 변경해 보세요."
      studentListLoadTitle="학생 목록을 불러오지 못했습니다"
      summaryEmptyTitle="학생을 선택하세요"
      summaryEmptyDescription="좌측 목록에서 학생을 클릭하면 누적 점수와 처리 내역이 표시됩니다."
      detailLoadTitle="학생 정보를 불러오지 못했습니다"
      searchTitle="학생별 조회"
      searchSubtitle="학생을 검색하고 선택하면 누적 상벌점 요약과 처리 내역을 확인할 수 있습니다."
      initialEntryResponse={EMPTY_ENTRY_RESPONSE}
    />
  )
}
