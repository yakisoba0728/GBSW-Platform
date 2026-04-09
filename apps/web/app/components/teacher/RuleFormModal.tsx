'use client'

import SharedRuleFormModal from './SharedRuleFormModal'
import type { SchoolMileageRuleSummary } from './school-mileage-types'

interface RuleFormModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  rule?: SchoolMileageRuleSummary | null
  categories: string[]
  existingRules: SchoolMileageRuleSummary[]
  onSuccess: () => Promise<void> | void
  apiPath?: string
}

export default function RuleFormModal(props: RuleFormModalProps) {
  return (
    <SharedRuleFormModal<SchoolMileageRuleSummary>
      {...props}
      apiPath={props.apiPath ?? '/api/teacher/school-mileage/rules'}
      datalistId="rule-category-list"
    />
  )
}
