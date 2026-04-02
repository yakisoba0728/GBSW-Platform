import StudentShell from './_components/StudentShell'
import { requireRoleSession } from '@/lib/route-guards'

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireRoleSession('student')

  return <StudentShell>{children}</StudentShell>
}
