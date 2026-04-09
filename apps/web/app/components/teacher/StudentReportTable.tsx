'use client'

import SharedStudentReportTable from './SharedStudentReportTable'
import type {
  SchoolMileageHistoryItem,
  StudentMileageSummary,
} from './school-mileage-types'

export default function StudentReportTable({
  students,
  startDate,
  endDate,
}: {
  students: StudentMileageSummary[]
  startDate: string
  endDate: string
}) {
  return (
    <SharedStudentReportTable<StudentMileageSummary, SchoolMileageHistoryItem>
      students={students}
      startDate={startDate}
      endDate={endDate}
      entriesApiPath="/api/teacher/school-mileage/entries"
      emptyDescription="이 학생에게 아직 상벌점 내역이 없습니다."
    />
  )
}
