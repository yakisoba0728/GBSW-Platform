'use client'

import SharedRuleSelectionModal from './SharedRuleSelectionModal'
import type { DormMileageRuleSummary } from './dorm-mileage-types'

type DormRuleSelectionModalProps = {
  isOpen: boolean
  rewardRules: DormMileageRuleSummary[]
  penaltyRules: DormMileageRuleSummary[]
  currentRuleId: number | ''
  onSelect: (rule: DormMileageRuleSummary, score: number) => void
  onClose: () => void
}

export default function DormRuleSelectionModal(props: DormRuleSelectionModalProps) {
  return (
    <SharedRuleSelectionModal<DormMileageRuleSummary>
      {...props}
      title="기숙사 상벌점 항목 선택"
      description="항목을 선택하면 기본 점수가 자동 적용됩니다. 범위가 있는 항목은 점수를 직접 입력할 수 있습니다."
      allowScoreRange
    />
  )
}
