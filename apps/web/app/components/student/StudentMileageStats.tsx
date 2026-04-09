'use client'

import SharedStudentMileageStatsView from './SharedStudentMileageStatsView'

export default function StudentMileageStats() {
  return (
    <SharedStudentMileageStatsView
      statsPath="/api/student/school-mileage/stats"
      introDescription="나의 상벌점 통계를 확인하세요."
    />
  )
}
