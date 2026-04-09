'use client'

import SharedStudentMileageStatsView from './SharedStudentMileageStatsView'

export default function StudentMileageStats() {
  return (
    <SharedStudentMileageStatsView
      summaryPath="/api/student/school-mileage/summary"
      entriesPath="/api/student/school-mileage/entries"
      introDescription="나의 상벌점 통계를 확인하세요."
      entriesLoadFailureMessage="상벌점 내역을 불러오지 못했습니다."
    />
  )
}
