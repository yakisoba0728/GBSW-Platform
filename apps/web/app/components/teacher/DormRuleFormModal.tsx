'use client'

import SharedRuleFormModal from './SharedRuleFormModal'
import type { DormMileageRuleSummary } from './dorm-mileage-types'

interface DormRuleFormModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  rule?: DormMileageRuleSummary | null
  categories: string[]
  existingRules: DormMileageRuleSummary[]
  onSuccess: () => Promise<void> | void
  apiPath?: string
}

export default function DormRuleFormModal(props: DormRuleFormModalProps) {
  return (
    <SharedRuleFormModal<DormMileageRuleSummary>
      {...props}
      apiPath={props.apiPath ?? '/api/teacher/dorm-mileage/rules'}
      datalistId="dorm-rule-category-list"
      allowScoreRange
    />
  )
}
