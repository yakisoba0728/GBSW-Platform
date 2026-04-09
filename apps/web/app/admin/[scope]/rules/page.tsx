'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import { useRulesContext, useDormRulesContext } from '@/app/components/mileage/rules-context'
import SchoolMileageRules from '@/app/components/teacher/SchoolMileageRules'
import DormMileageRules from '@/app/components/teacher/DormMileageRules'

function SchoolRulesWrapper() {
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

function DormRulesWrapper() {
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

export default function AdminScopeRulesPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = use(params)
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return scope === 'dorm' ? <DormRulesWrapper /> : <SchoolRulesWrapper />
}
