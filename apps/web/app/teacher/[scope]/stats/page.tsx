import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import SchoolMileageStats from '@/app/components/teacher/SchoolMileageStats'
import DormMileageStats from '@/app/components/teacher/DormMileageStats'

export default async function TeacherScopeStatsPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return (
    <div className="flex flex-col h-full">
      {scope === 'dorm' ? <DormMileageStats /> : <SchoolMileageStats />}
    </div>
  )
}
