import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import StudentMileageRules from '@/app/components/student/StudentMileageRules'
import StudentDormMileageRules from '@/app/components/student/StudentDormMileageRules'

export default async function StudentScopeRulesPage({
  params,
}: {
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return (
    <div className="flex flex-col h-full">
      {scope === 'dorm' ? <StudentDormMileageRules /> : <StudentMileageRules />}
    </div>
  )
}
