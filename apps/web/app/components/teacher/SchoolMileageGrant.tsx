'use client'

import SharedGrantRowCard from './SharedGrantRowCard'
import SharedRuleSelectionModal from './SharedRuleSelectionModal'
import SharedMileageGrantView from './SharedMileageGrantView'
import SharedStudentSelectionModal from './SharedStudentSelectionModal'
import type {
  CreateSchoolMileageEntriesPayload,
  SchoolMileageRuleSummary,
  SchoolMileageStudentOption,
} from './school-mileage-types'

type GrantRow = {
  localId: number
  student: SchoolMileageStudentOption
  ruleId: number | ''
  score: number | ''
  reason: string
}

export default function SchoolMileageGrant({
  rules,
  isRulesLoading,
  rulesError,
}: {
  rules: SchoolMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
}) {
  return (
    <SharedMileageGrantView<
      SchoolMileageStudentOption,
      SchoolMileageRuleSummary,
      GrantRow,
      CreateSchoolMileageEntriesPayload
    >
      rules={rules}
      isRulesLoading={isRulesLoading}
      rulesError={rulesError}
      createRow={(localId, student) => ({
        localId,
        student,
        ruleId: '',
        score: '',
        reason: '',
      })}
      buildPayload={(rows) => ({
        entries: rows.map((row) => ({
          studentId: row.student.studentId,
          ruleId: Number(row.ruleId),
          score: Number(row.score),
          ...(row.reason.trim() ? { reason: row.reason.trim() } : {}),
        })),
      })}
      submitPath="/api/teacher/school-mileage/entries"
      submitErrorMessage="상벌점 부여에 실패했습니다."
      submitRequestErrorMessage="상벌점 부여 요청 중 문제가 발생했습니다."
      submitSuccessMessage="상벌점이 부여되었습니다."
      emptyDescription="상단 버튼으로 학생을 추가한 뒤 규칙과 점수를 입력하세요."
      submitIdleLabel={(rowCount) => `전체 부여하기 (${rowCount}명)`}
      renderStudentSelectionModal={(props) => (
        <SharedStudentSelectionModal<SchoolMileageStudentOption>
          {...props}
          apiPath="/api/teacher/school-mileage/students"
          title="대상 학생 추가"
          description="학교와 학년 조건으로 학생을 찾아 추가하세요."
          emptyDescription="학교와 학년 조건을 바꿔 다시 찾아보세요."
          loadErrorMessage="학생 목록을 불러오지 못했습니다."
          fetchErrorMessage="학생 목록을 불러오는 중 문제가 발생했습니다."
          showSchoolFilter
          showSchoolLabel
        />
      )}
      renderRuleSelectionModal={(props) => (
        <SharedRuleSelectionModal<SchoolMileageRuleSummary>
          isOpen={props.isOpen}
          rewardRules={props.rewardRules}
          penaltyRules={props.penaltyRules}
          currentRuleId={props.currentRuleId}
          title="상벌점 항목 선택"
          description="항목을 선택하면 기본 점수가 자동 적용됩니다."
          onSelect={(rule) => props.onSelectRule({ ruleId: rule.id })}
          onClose={props.onClose}
        />
      )}
      renderGrantRowCard={(props) => (
        <SharedGrantRowCard<
          SchoolMileageStudentOption,
          SchoolMileageRuleSummary,
          GrantRow
        >
          {...props}
          showSchoolLabel
        />
      )}
    />
  )
}
