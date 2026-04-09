'use client'

import SharedStudentMileageRulesView from './SharedStudentMileageRulesView'

export default function StudentMileageRules() {
  return (
    <SharedStudentMileageRulesView
      rulesPath="/api/student/school-mileage/rules"
      loadFailureMessage="규정 목록을 불러오지 못했습니다."
      loadExceptionMessage="규정 목록 조회 중 문제가 발생했습니다."
      tabIndicatorLayoutId="rule-tab-indicator"
    />
  )
}
