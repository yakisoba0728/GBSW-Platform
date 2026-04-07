'use client'

import DormMileageRules from '@/app/components/teacher/DormMileageRules'
import { useDormRulesContext } from '@/app/components/dorm-mileage/dorm-rules-context'

export default function TeacherDormMileageRulesPage() {
  const { rules, isRulesLoading, rulesError, loadRules } = useDormRulesContext()

  return (
    <DormMileageRules
      rules={rules}
      isRulesLoading={isRulesLoading}
      rulesError={rulesError}
      loadRules={loadRules}
      readOnly={true}
    />
  )
}
