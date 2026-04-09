'use client'

import SharedGrantRowCard from './SharedGrantRowCard'
import SharedRuleSelectionModal from './SharedRuleSelectionModal'
import SharedStudentSelectionModal from './SharedStudentSelectionModal'
import SharedMileageGrantView from './SharedMileageGrantView'
import { useDormRulesContext } from '../mileage/rules-context'
import type {
  CreateDormMileageEntriesPayload,
  DormMileageRuleSummary,
  DormMileageStudentOption,
} from './dorm-mileage-types'

type DormGrantRow = {
  localId: number
  student: DormMileageStudentOption
  ruleId: number | ''
  score: number | ''
  reason: string
}

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
        <SharedStudentSelectionModal<DormMileageStudentOption>
          {...props}
          apiPath="/api/teacher/dorm-mileage/students"
          title="대상 학생 추가"
          description="학년·반 조건으로 기숙사 학생을 찾아 추가하세요."
          emptyDescription="학년·반 조건을 바꿔 다시 찾아보세요."
          loadErrorMessage="학생 목록을 불러오지 못했습니다."
          fetchErrorMessage="학생 목록을 불러오는 중 문제가 발생했습니다."
        />
      )}
      renderRuleSelectionModal={(props) => (
        <SharedRuleSelectionModal<DormMileageRuleSummary>
          isOpen={props.isOpen}
          rewardRules={props.rewardRules}
          penaltyRules={props.penaltyRules}
          currentRuleId={props.currentRuleId}
          title="기숙사 상벌점 항목 선택"
          description="항목을 선택하면 기본 점수가 자동 적용됩니다. 범위가 있는 항목은 점수를 직접 입력할 수 있습니다."
          allowScoreRange
          onSelect={(rule, score) =>
            props.onSelectRule({ ruleId: rule.id, score })
          }
          onClose={props.onClose}
        />
      )}
      renderGrantRowCard={(props) => (
        <SharedGrantRowCard<
          DormMileageStudentOption,
          DormMileageRuleSummary,
          DormGrantRow
        >
          {...props}
        />
      )}
    />
  )
}
