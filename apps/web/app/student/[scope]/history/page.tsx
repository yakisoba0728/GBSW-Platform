import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import StudentMileageHistory from '@/app/components/student/StudentMileageHistory'
import StudentDormMileageHistory from '@/app/components/student/StudentDormMileageHistory'

export default async function StudentScopeHistoryPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return (
    <div className="flex flex-col h-full">
      {scope === 'dorm' ? <StudentDormMileageHistory /> : <StudentMileageHistory />}
    </div>
  )
}
