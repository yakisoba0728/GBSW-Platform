'use client'

import DormMileageRules from '@/app/components/teacher/DormMileageRules'
import { useDormRulesContext } from '@/app/components/dorm-mileage/dorm-rules-context'

export default function AdminDormMileageRulesPage() {
  const { rules, isRulesLoading, rulesError, loadRules } = useDormRulesContext()

  return (
    <div className="flex flex-col h-full">
      <DormMileageRules
        rules={rules}
        isRulesLoading={isRulesLoading}
        rulesError={rulesError}
        loadRules={loadRules}
        apiPath="/api/admin/dorm-mileage/rules"
      />
    </div>
  )
}
