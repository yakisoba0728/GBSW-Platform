'use client'

import { useEffect, useState } from 'react'
import DormMileageGrant from '@/app/components/teacher/DormMileageGrant'

export default function TeacherDormMileageGrantPage() {
  const [isDormTeacher, setIsDormTeacher] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/teacher/dorm-mileage/access', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: { isDormTeacher: boolean }) => setIsDormTeacher(data.isDormTeacher ?? false))
      .catch(() => setIsDormTeacher(false))
  }, [])

  if (isDormTeacher === null) {
    return null
  }

  return <DormMileageGrant isDormTeacher={isDormTeacher} />
}
