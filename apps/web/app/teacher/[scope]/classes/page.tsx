import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import SchoolMileageClass from '@/app/components/teacher/SchoolMileageClass'
import DormMileageClass from '@/app/components/teacher/DormMileageClass'

export default async function TeacherScopeClassesPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return (
    <div className="flex flex-col h-full">
      {scope === 'dorm' ? <DormMileageClass /> : <SchoolMileageClass />}
    </div>
  )
}
