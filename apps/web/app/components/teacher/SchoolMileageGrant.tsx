'use client'

import GrantRowCard, { type GrantRow } from './GrantRowCard'
import RuleSelectionModal from './RuleSelectionModal'
import SharedMileageGrantView from './SharedMileageGrantView'
import StudentSelectionModal from './StudentSelectionModal'
import type {
  CreateSchoolMileageEntriesPayload,
  SchoolMileageRuleSummary,
  SchoolMileageStudentOption,
} from './school-mileage-types'

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
      renderStudentSelectionModal={(props) => <StudentSelectionModal {...props} />}
      renderRuleSelectionModal={(props) => (
        <RuleSelectionModal
          isOpen={props.isOpen}
          rewardRules={props.rewardRules}
          penaltyRules={props.penaltyRules}
          currentRuleId={props.currentRuleId}
          onSelect={(rule) => props.onSelectRule({ ruleId: rule.id })}
          onClose={props.onClose}
        />
      )}
      renderGrantRowCard={(props) => <GrantRowCard {...props} />}
    />
  )
}
