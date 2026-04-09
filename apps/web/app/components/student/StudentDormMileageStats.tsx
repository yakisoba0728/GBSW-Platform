'use client'

import SharedStudentMileageStatsView from './SharedStudentMileageStatsView'

export default function StudentDormMileageStats() {
  return (
    <SharedStudentMileageStatsView
      statsPath="/api/student/dorm-mileage/stats"
      introDescription="나의 기숙사 상벌점 통계를 확인하세요."
    />
  )
}
