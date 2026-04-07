import StudentShell from './_components/StudentShell'
import { requireRoleSession } from '@/lib/route-guards'

function deriveSchool(accountId: string): 'GBSW' | 'BYMS' {
  return accountId.startsWith('BY') ? 'BYMS' : 'GBSW'
}

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRoleSession('student')
  const school = deriveSchool(session.accountId)

  return <StudentShell school={school}>{children}</StudentShell>
}
