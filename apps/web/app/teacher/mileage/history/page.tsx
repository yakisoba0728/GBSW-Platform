'use client'

import SchoolMileageHistory from '@/app/components/teacher/SchoolMileageHistory'
import { useRulesContext } from '@/app/components/mileage/rules-context'

export default function TeacherMileageHistoryPage() {
  const { rulesError } = useRulesContext()

  return <SchoolMileageHistory rulesError={rulesError} />
}
