import { redirect } from 'next/navigation'
import { requireRoleSession } from '@/lib/route-guards'

export default async function StudentDormMileageLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRoleSession('student')

  if (session.accountId.startsWith('BY')) {
    redirect('/student')
  }

  return <>{children}</>
}
