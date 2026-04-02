'use client'

import SchoolMileageHistory from '@/app/components/teacher/SchoolMileageHistory'
import { useRulesContext } from '../../_components/RulesContext'

export default function TeacherMileageHistoryPage() {
  const { rulesError } = useRulesContext()

  return <SchoolMileageHistory rulesError={rulesError} />
}
