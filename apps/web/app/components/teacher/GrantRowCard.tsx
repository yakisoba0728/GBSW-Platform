'use client'

import SharedGrantRowCard from './SharedGrantRowCard'
import type {
  SchoolMileageRuleSummary,
  SchoolMileageStudentOption,
} from './school-mileage-types'

export type GrantRow = {
  localId: number
  student: SchoolMileageStudentOption
  ruleId: number | ''
  score: number | ''
  reason: string
}

type GrantRowCardProps = {
  index: number
  row: GrantRow
  selectedRule: SchoolMileageRuleSummary | null
  disabled?: boolean
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onOpenRuleModal: () => void
  onReasonChange: (reason: string) => void
  onRemove: () => void
}

export default function GrantRowCard(props: GrantRowCardProps) {
  return (
    <SharedGrantRowCard<
      SchoolMileageStudentOption,
      SchoolMileageRuleSummary,
      GrantRow
    >
      {...props}
      showSchoolLabel
    />
  )
}
