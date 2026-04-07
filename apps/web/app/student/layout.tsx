import StudentShell from './_components/StudentShell'
import { requireRoleSession } from '@/lib/route-guards'
import { redirect } from 'next/navigation'

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRoleSession('student')

  if (!session.school) {
    redirect('/')
  }

  return <StudentShell school={session.school}>{children}</StudentShell>
}
