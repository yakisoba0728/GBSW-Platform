'use client'

import { useDormRulesContext } from '@/app/components/dorm-mileage/dorm-rules-context'
import DormMileageGrant from '@/app/components/teacher/DormMileageGrant'
import { Card } from '@/app/components/mileage/shared'
import { ListSkeleton } from '@/app/components/ui/list'

export default function TeacherDormMileageGrantPage() {
  const { isDormTeacher } = useDormRulesContext()

  if (isDormTeacher === null) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <div className="mb-2 h-4 w-40 rounded-md" style={{ backgroundColor: 'var(--border)' }} />
          <div className="h-3 w-64 rounded-md" style={{ backgroundColor: 'var(--border)' }} />
        </Card>
        <Card className="min-h-[360px]">
          <ListSkeleton count={4} rowHeight="h-16" />
        </Card>
      </div>
    )
  }

  return <DormMileageGrant isDormTeacher={isDormTeacher} />
}
