import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import SchoolMileageStudentView from '@/app/components/teacher/SchoolMileageStudentView'
import DormMileageStudentView from '@/app/components/teacher/DormMileageStudentView'

export default async function TeacherScopeStudentsPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return (
    <div className="flex flex-col h-full">
      {scope === 'dorm' ? <DormMileageStudentView /> : <SchoolMileageStudentView />}
    </div>
  )
}
