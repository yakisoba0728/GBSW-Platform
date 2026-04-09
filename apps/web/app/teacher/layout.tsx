import TeacherShell from './_components/TeacherShell'
import { requireRoleSession } from '@/lib/route-guards'

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireRoleSession('teacher')

  return <TeacherShell>{children}</TeacherShell>
}
