'use client'

import SchoolMileageRules from '@/app/components/teacher/SchoolMileageRules'
import { useRulesContext } from '@/app/components/mileage/rules-context'

export default function TeacherMileageRulesPage() {
  const { rules, isRulesLoading, rulesError, loadRules } = useRulesContext()

  return (
    <SchoolMileageRules
      rules={rules}
      isRulesLoading={isRulesLoading}
      rulesError={rulesError}
      loadRules={loadRules}
      readOnly={true}
    />
  )
}
