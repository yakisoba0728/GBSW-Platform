'use client'

import DormGrantRowCard, { type DormGrantRow } from './DormGrantRowCard'
import DormRuleSelectionModal from './DormRuleSelectionModal'
import DormStudentSelectionModal from './DormStudentSelectionModal'
import SharedMileageGrantView from './SharedMileageGrantView'
import { useDormRulesContext } from '../dorm-mileage/dorm-rules-context'
import type {
  CreateDormMileageEntriesPayload,
  DormMileageRuleSummary,
  DormMileageStudentOption,
} from './dorm-mileage-types'

export default function DormMileageGrant({
  isDormTeacher,
}: {
  isDormTeacher: boolean
}) {
  const { rules, isRulesLoading, rulesError } = useDormRulesContext()

  return (
    <SharedMileageGrantView<
      DormMileageStudentOption,
      DormMileageRuleSummary,
      DormGrantRow,
      CreateDormMileageEntriesPayload
    >
      rules={rules}
      isRulesLoading={isRulesLoading}
      rulesError={rulesError}
      isReadOnly={!isDormTeacher}
      accessOverlayMessage="사감 교사만 기숙사 상벌점을 부여할 수 있습니다."
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
      submitPath="/api/teacher/dorm-mileage/entries"
      submitErrorMessage="기숙사 상벌점 부여에 실패했습니다."
      submitRequestErrorMessage="기숙사 상벌점 부여 요청 중 문제가 발생했습니다."
      submitSuccessMessage="기숙사 상벌점이 부여되었습니다."
      emptyDescription="상단 버튼으로 학생을 추가한 뒤 규칙과 점수를 입력하세요."
      submitIdleLabel={(rowCount) => `전체 부여하기 (${rowCount}명)`}
      renderStudentSelectionModal={(props) => (
        <DormStudentSelectionModal {...props} />
      )}
      renderRuleSelectionModal={(props) => (
        <DormRuleSelectionModal
          isOpen={props.isOpen}
          rewardRules={props.rewardRules}
          penaltyRules={props.penaltyRules}
          currentRuleId={props.currentRuleId}
          onSelect={(rule, score) =>
            props.onSelectRule({ ruleId: rule.id, score })
          }
          onClose={props.onClose}
        />
      )}
      renderGrantRowCard={(props) => <DormGrantRowCard {...props} />}
    />
  )
}
