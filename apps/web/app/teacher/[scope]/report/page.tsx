import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import SchoolMileageReport from '@/app/components/teacher/SchoolMileageReport'
import DormMileageReport from '@/app/components/teacher/DormMileageReport'

export default async function TeacherScopeReportPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return (
    <div className="flex flex-col h-full">
      {scope === 'dorm' ? <DormMileageReport /> : <SchoolMileageReport />}
    </div>
  )
}
