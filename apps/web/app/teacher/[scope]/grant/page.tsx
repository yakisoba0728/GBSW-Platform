'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import { useRulesContext, useDormRulesContext } from '@/app/components/mileage/rules-context'
import SchoolMileageGrant from '@/app/components/teacher/SchoolMileageGrant'
import DormMileageGrant from '@/app/components/teacher/DormMileageGrant'
import { LoadingSpinner } from '@/app/components/ui/list'
import { useLoadingGate } from '@/app/components/ui/useLoadingGate'

function DormGrantWrapper() {
  const { isDormTeacher } = useDormRulesContext()
  const showLoading = useLoadingGate({
    active: isDormTeacher === null,
    initialVisible: false,
  })

  if (showLoading) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (isDormTeacher === null) {
    return null
  }

  return (
    <div className="flex flex-col h-full">
      <DormMileageGrant isDormTeacher={isDormTeacher} />
    </div>
  )
}

function SchoolGrantWrapper() {
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

export default function TeacherScopeGrantPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = use(params)
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return scope === 'dorm' ? <DormGrantWrapper /> : <SchoolGrantWrapper />
}
