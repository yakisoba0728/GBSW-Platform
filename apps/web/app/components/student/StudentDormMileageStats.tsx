'use client'

import SharedStudentMileageStatsView from './SharedStudentMileageStatsView'

export default function StudentDormMileageStats() {
  return (
    <SharedStudentMileageStatsView
      summaryPath="/api/student/dorm-mileage/summary"
      entriesPath="/api/student/dorm-mileage/entries"
      introDescription="나의 기숙사 상벌점 통계를 확인하세요."
      entriesLoadFailureMessage="기숙사 상벌점 내역을 불러오지 못했습니다."
    />
  )
}
