'use client'

import SharedStudentReportTable from './SharedStudentReportTable'
import type {
  DormMileageHistoryItem,
  DormStudentMileageSummary,
} from './dorm-mileage-types'

export default function DormStudentReportTable({
  students,
  startDate,
  endDate,
}: {
  students: DormStudentMileageSummary[]
  startDate: string
  endDate: string
}) {
  return (
    <SharedStudentReportTable<
      DormStudentMileageSummary,
      DormMileageHistoryItem
    >
      students={students}
      startDate={startDate}
      endDate={endDate}
      entriesApiPath="/api/teacher/dorm-mileage/entries"
      emptyDescription="이 학생에게 아직 기숙사 상벌점 내역이 없습니다."
    />
  )
}
