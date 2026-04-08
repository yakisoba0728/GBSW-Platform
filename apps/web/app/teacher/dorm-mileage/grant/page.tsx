'use client'

import { useDormRulesContext } from '@/app/components/dorm-mileage/dorm-rules-context'
import DormMileageGrant from '@/app/components/teacher/DormMileageGrant'
import { LoadingSpinner } from '@/app/components/ui/list'

export default function TeacherDormMileageGrantPage() {
  const { isDormTeacher } = useDormRulesContext()

  if (isDormTeacher === null) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DormMileageGrant isDormTeacher={isDormTeacher} />
    </div>
  )
}
