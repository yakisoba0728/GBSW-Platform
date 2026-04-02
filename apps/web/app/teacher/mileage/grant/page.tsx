'use client'

import SchoolMileageGrant from '@/app/components/teacher/SchoolMileageGrant'
import { useRulesContext } from '../../_components/RulesContext'

export default function TeacherMileageGrantPage() {
  const { rules, isRulesLoading, rulesError } = useRulesContext()

  return (
    <SchoolMileageGrant
      rules={rules}
      isRulesLoading={isRulesLoading}
      rulesError={rulesError}
    />
  )
}
