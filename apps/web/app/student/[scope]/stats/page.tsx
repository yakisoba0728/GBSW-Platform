import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import StudentMileageStats from '@/app/components/student/StudentMileageStats'
import StudentDormMileageStats from '@/app/components/student/StudentDormMileageStats'

export default async function StudentScopeStatsPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return (
    <div className="flex flex-col h-full">
      {scope === 'dorm' ? <StudentDormMileageStats /> : <StudentMileageStats />}
    </div>
  )
}
