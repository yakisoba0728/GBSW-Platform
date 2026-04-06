'use client'

import SchoolMileageRules from '@/app/components/teacher/SchoolMileageRules'
import { useRulesContext } from '../../_components/RulesContext'

export default function TeacherMileageRulesPage() {
  const { rules, isRulesLoading, rulesError, loadRules } = useRulesContext()

  return (
    <SchoolMileageRules
      rules={rules}
      isRulesLoading={isRulesLoading}
      rulesError={rulesError}
      loadRules={loadRules}
    />
  )
}
