'use client'

import SchoolMileageGrant from '@/app/components/teacher/SchoolMileageGrant'
import { useRulesContext } from '@/app/components/mileage/rules-context'

export default function TeacherMileageGrantPage() {
  const { rules, isRulesLoading, rulesError } = useRulesContext()

  return (
    <div className="flex flex-col h-full">
      <SchoolMileageGrant
        rules={rules}
        isRulesLoading={isRulesLoading}
        rulesError={rulesError}
      />
    </div>
  )
}
