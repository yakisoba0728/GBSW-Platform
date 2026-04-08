'use client'

import { useDormRulesContext } from '@/app/components/dorm-mileage/dorm-rules-context'
import DormMileageGrant from '@/app/components/teacher/DormMileageGrant'
import { LoadingSpinner } from '@/app/components/ui/list'

import { useLoadingGate } from '@/app/components/ui/useLoadingGate'

export default function TeacherDormMileageGrantPage() {
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
