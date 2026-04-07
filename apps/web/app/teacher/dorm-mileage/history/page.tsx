'use client'

import DormMileageHistory from '@/app/components/teacher/DormMileageHistory'
import { useDormRulesContext } from '@/app/components/dorm-mileage/dorm-rules-context'

export default function TeacherDormMileageHistoryPage() {
  const { rulesError } = useDormRulesContext()

  return <DormMileageHistory rulesError={rulesError} />
}
