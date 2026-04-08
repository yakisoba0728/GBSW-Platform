'use client'

import SchoolMileageRules from '@/app/components/teacher/SchoolMileageRules'
import { useRulesContext } from '@/app/components/mileage/rules-context'

export default function AdminMileageRulesPage() {
  const { rules, isRulesLoading, rulesError, loadRules } = useRulesContext()

  return (
    <div className="flex flex-col h-full">
      <SchoolMileageRules
        rules={rules}
        isRulesLoading={isRulesLoading}
        rulesError={rulesError}
        loadRules={loadRules}
        apiPath="/api/admin/school-mileage/rules"
      />
    </div>
  )
}
