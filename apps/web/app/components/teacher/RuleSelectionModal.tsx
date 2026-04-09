'use client'

import SharedRuleSelectionModal from './SharedRuleSelectionModal'
import type { SchoolMileageRuleSummary } from './school-mileage-types'

type RuleSelectionModalProps = {
  isOpen: boolean
  rewardRules: SchoolMileageRuleSummary[]
  penaltyRules: SchoolMileageRuleSummary[]
  currentRuleId: number | ''
  onSelect: (rule: SchoolMileageRuleSummary) => void
  onClose: () => void
}

export default function RuleSelectionModal({
  onSelect,
  ...props
}: RuleSelectionModalProps) {
  return (
    <SharedRuleSelectionModal<SchoolMileageRuleSummary>
      {...props}
      title="상벌점 항목 선택"
      description="항목을 선택하면 기본 점수가 자동 적용됩니다."
      onSelect={(rule) => onSelect(rule)}
    />
  )
}
