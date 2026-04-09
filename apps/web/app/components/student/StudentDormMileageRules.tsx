'use client'

import SharedStudentMileageRulesView from './SharedStudentMileageRulesView'

export default function StudentDormMileageRules() {
  return (
    <SharedStudentMileageRulesView
      rulesPath="/api/student/dorm-mileage/rules"
      loadFailureMessage="기숙사 규정 목록을 불러오지 못했습니다."
      loadExceptionMessage="기숙사 규정 목록 조회 중 문제가 발생했습니다."
      tabIndicatorLayoutId="dorm-rule-tab-indicator"
    />
  )
}
