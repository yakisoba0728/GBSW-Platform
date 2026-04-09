import StudentHome from './_components/StudentHome'
import { requireRoleSession } from '@/lib/route-guards'

export default async function StudentPage() {
  const session = await requireRoleSession('student')

  return <StudentHome school={session.school} />
}
