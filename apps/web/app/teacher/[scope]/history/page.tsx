'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import { useRulesContext, useDormRulesContext } from '@/app/components/mileage/rules-context'
import SchoolMileageHistory from '@/app/components/teacher/SchoolMileageHistory'
import DormMileageHistory from '@/app/components/teacher/DormMileageHistory'

function SchoolHistoryWrapper() {
  const { rulesError } = useRulesContext()
  return (
    <div className="flex flex-col h-full">
      <SchoolMileageHistory rulesError={rulesError} />
    </div>
  )
}

function DormHistoryWrapper() {
  const { rulesError } = useDormRulesContext()
  return (
    <div className="flex flex-col h-full">
      <DormMileageHistory rulesError={rulesError} />
    </div>
  )
}

export default function TeacherScopeHistoryPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = use(params)
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return scope === 'dorm' ? <DormHistoryWrapper /> : <SchoolHistoryWrapper />
}
