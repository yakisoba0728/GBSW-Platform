'use client'

import SharedGrantRowCard from './SharedGrantRowCard'
import type {
  DormMileageRuleSummary,
  DormMileageStudentOption,
} from './dorm-mileage-types'

export type DormGrantRow = {
  localId: number
  student: DormMileageStudentOption
  ruleId: number | ''
  score: number | ''
  reason: string
}

type DormGrantRowCardProps = {
  index: number
  row: DormGrantRow
  selectedRule: DormMileageRuleSummary | null
  disabled?: boolean
  readOnly?: boolean
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onOpenRuleModal: () => void
  onReasonChange: (reason: string) => void
  onRemove: () => void
}

export default function DormGrantRowCard(props: DormGrantRowCardProps) {
  return (
    <SharedGrantRowCard<
      DormMileageStudentOption,
      DormMileageRuleSummary,
      DormGrantRow
    >
      {...props}
    />
  )
}
